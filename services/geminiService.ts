import { GoogleGenAI, Type } from "@google/genai";
import { PantryItem, Recipe, DayPlan, GroceryItem } from "../types";

// Helper to get the AI instance
const getAI = () => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) {
    console.error("API Key is missing!");
    throw new Error("API Key is missing");
  }
  return new GoogleGenAI({ apiKey });
};

// Helper to encode image file to base64
export const fileToGenerativePart = async (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64String = reader.result as string;
      // Remove data url prefix (e.g. "data:image/jpeg;base64,")
      const base64 = base64String.split(',')[1];
      resolve(base64);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
};

export const identifyPantryItems = async (imageBase64: string, mimeType: string = 'image/jpeg'): Promise<PantryItem[]> => {
  const ai = getAI();
  
  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: {
        parts: [
          {
            inlineData: {
              data: imageBase64,
              mimeType: mimeType,
            },
          },
          {
            text: "Identify the food items in this image. Estimate their quantity and a likely expiry date (YYYY-MM-DD) starting from today (assume today is May 15, 2024 for consistency if needed, or just use current date logic). Return a JSON array.",
          },
        ],
      },
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              name: { type: Type.STRING },
              quantity: { type: Type.NUMBER },
              unit: { type: Type.STRING },
              expiryDate: { type: Type.STRING, description: "YYYY-MM-DD format" },
              category: { type: Type.STRING },
            },
            required: ["name", "quantity", "unit", "category"],
          },
        },
      },
    });

    const data = JSON.parse(response.text || "[]");
    return data.map((item: any, index: number) => ({
      ...item,
      id: `scanned-${Date.now()}-${index}`,
    }));
  } catch (error) {
    console.error("Error identifying items:", error);
    return [];
  }
};

export const suggestRecipes = async (pantryItems: PantryItem[]): Promise<Recipe[]> => {
  const ai = getAI();
  const ingredientsList = pantryItems.map(i => `${i.quantity} ${i.unit} ${i.name}`).join(", ");

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: `Suggest 3 creative recipes I can make mostly with these ingredients: ${ingredientsList}. 
      Focus on minimizing waste. It's okay to assume basic staples like oil, salt, pepper, water.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              id: { type: Type.STRING },
              title: { type: Type.STRING },
              description: { type: Type.STRING },
              ingredients: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    name: { type: Type.STRING },
                    amount: { type: Type.STRING },
                    isPantryItem: { type: Type.BOOLEAN },
                  }
                }
              },
              steps: { type: Type.ARRAY, items: { type: Type.STRING } },
              prepTimeMinutes: { type: Type.NUMBER },
              calories: { type: Type.NUMBER },
              missingIngredientsCount: { type: Type.NUMBER },
            },
          },
        },
      },
    });

    const data = JSON.parse(response.text || "[]");
    return data.map((r: any) => ({ ...r, id: `recipe-${Math.random().toString(36).substr(2, 9)}` }));
  } catch (error) {
    console.error("Error generating recipes:", error);
    return [];
  }
};

export const generateWeeklyPlan = async (pantryItems: PantryItem[]): Promise<DayPlan[]> => {
  const ai = getAI();
  const ingredientsList = pantryItems.map(i => i.name).join(", ");

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: `Create a 3-day meal plan (Breakfast, Lunch, Dinner) that uses these ingredients to reduce waste: ${ingredientsList}.
      If ingredients are missing, assume I will buy them.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              day: { type: Type.STRING },
              meals: {
                type: Type.OBJECT,
                properties: {
                  breakfast: {
                     type: Type.OBJECT,
                     properties: {
                        title: { type: Type.STRING },
                        description: { type: Type.STRING },
                        prepTimeMinutes: { type: Type.NUMBER },
                        calories: { type: Type.NUMBER },
                     }
                  },
                  lunch: {
                     type: Type.OBJECT,
                     properties: {
                        title: { type: Type.STRING },
                        description: { type: Type.STRING },
                        prepTimeMinutes: { type: Type.NUMBER },
                        calories: { type: Type.NUMBER },
                     }
                  },
                  dinner: {
                     type: Type.OBJECT,
                     properties: {
                        title: { type: Type.STRING },
                        description: { type: Type.STRING },
                        prepTimeMinutes: { type: Type.NUMBER },
                        calories: { type: Type.NUMBER },
                     }
                  },
                }
              }
            }
          }
        }
      }
    });
    
    // Note: The schema above simplifies the Recipe object for the plan to save tokens, 
    // in a real app we might want full recipe details or fetch them on demand.
    return JSON.parse(response.text || "[]");
  } catch (e) {
    console.error("Plan generation failed", e);
    return [];
  }
};

export const generateGroceryList = async (plan: DayPlan[], pantryItems: PantryItem[]): Promise<GroceryItem[]> => {
  const ai = getAI();
  const planStr = JSON.stringify(plan);
  const pantryStr = JSON.stringify(pantryItems.map(p => p.name));

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: `Based on this meal plan: ${planStr}, and my current pantry: ${pantryStr}, generate a grocery shopping list for missing items.
      Estimate the price in USD for each item. Categorize them.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              name: { type: Type.STRING },
              quantity: { type: Type.STRING },
              estimatedPrice: { type: Type.NUMBER },
              category: { type: Type.STRING },
            },
          },
        },
      },
    });

    const data = JSON.parse(response.text || "[]");
    return data.map((item: any, idx: number) => ({
      ...item,
      id: `grocery-${idx}`,
      checked: false
    }));
  } catch (e) {
    console.error("Grocery list failed", e);
    return [];
  }
}
