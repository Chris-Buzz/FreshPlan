
import { GoogleGenAI, Type } from "@google/genai";
import { PantryItem, Recipe, DayPlan, GroceryItem, UserProfile, Macros, RestockSuggestion } from "../types";

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
            text: `Analyze this image. It is either:
            1. A photo of food items on a shelf/table.
            2. A photo of a GROCERY RECEIPT.
            
            Identify the food items. 
            If it's a receipt, parse the text to find item names.
            Estimate the quantity and unit.
            CRITICAL: You MUST estimate the Macros (Calories, Protein, Carbs, Fat, Sugar) PER UNIT for each item based on standard nutritional data. All 5 fields are mandatory.
            Return a JSON array. Do NOT include any expiry dates.`,
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
              category: { type: Type.STRING },
              macros: {
                type: Type.OBJECT,
                properties: {
                  calories: { type: Type.NUMBER },
                  protein: { type: Type.NUMBER, description: "grams" },
                  carbs: { type: Type.NUMBER, description: "grams" },
                  fats: { type: Type.NUMBER, description: "grams" },
                  sugar: { type: Type.NUMBER, description: "grams" }
                },
                required: ["calories", "protein", "carbs", "fats", "sugar"]
              }
            },
            required: ["name", "quantity", "unit", "category", "macros"],
          },
        },
      },
    });

    const data = JSON.parse(response.text || "[]");
    return data.map((item: any, index: number) => ({
      ...item,
      id: `scanned-${Date.now()}-${index}`,
      expiryDate: '' // Force empty to require manual entry
    }));
  } catch (error) {
    console.error("Error identifying items:", error);
    return [];
  }
};

export const analyzeMeal = async (imageBase64: string, mimeType: string = 'image/jpeg'): Promise<Macros | null> => {
    const ai = getAI();
    try {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: {
                parts: [
                    { inlineData: { data: imageBase64, mimeType } },
                    { text: "Analyze this meal image. Estimate the total Calories, Protein, Carbs, Fat, and Sugar for the ENTIRE portion shown." }
                ]
            },
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        calories: { type: Type.NUMBER },
                        protein: { type: Type.NUMBER },
                        carbs: { type: Type.NUMBER },
                        fats: { type: Type.NUMBER },
                        sugar: { type: Type.NUMBER }
                    },
                    required: ["calories", "protein", "carbs", "fats", "sugar"]
                }
            }
        });
        return JSON.parse(response.text || "null");
    } catch (e) {
        console.error("Meal analysis failed", e);
        return null;
    }
};

export const suggestRecipes = async (pantryItems: PantryItem[]): Promise<Recipe[]> => {
  const ai = getAI();
  const ingredientsList = pantryItems.map(i => `${i.quantity} ${i.unit} ${i.name}`).join(", ").slice(0, 1000); // Limit length

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: `Suggest 3 creative recipes I can make mostly with these ingredients: ${ingredientsList}. 
      Focus on minimizing waste. Provide clear steps.
      IMPORTANT: Calculate the Macros (Calories, Protein, Carbs, Fat, Sugar) for the ENTIRE recipe.`,
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
              macros: {
                type: Type.OBJECT,
                properties: {
                  calories: { type: Type.NUMBER },
                  protein: { type: Type.NUMBER },
                  carbs: { type: Type.NUMBER },
                  fats: { type: Type.NUMBER },
                  sugar: { type: Type.NUMBER }
                },
                required: ["calories", "protein", "carbs", "fats", "sugar"]
              },
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

export const suggestInspirationRecipes = async (userProfile: UserProfile | null): Promise<Recipe[]> => {
  const ai = getAI();
  const goalContext = userProfile 
    ? `Goal: ${userProfile.goal}. Diet: ${userProfile.dietaryType}. Allergies: ${userProfile.allergies}.` 
    : "Goal: Healthy eating.";

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: `Suggest 4 popular, delicious recipes that align with this user's profile: ${goalContext}.
      Ignore current pantry inventory. I want to shop for these ingredients.
      Focus on high nutrition and flavor.
      Return title, description, macros, prep time, and the full ingredient list.`,
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
                    amount: { type: Type.STRING }
                  },
                  required: ["name", "amount"]
                }
              },
              prepTimeMinutes: { type: Type.NUMBER },
              macros: {
                type: Type.OBJECT,
                properties: {
                  calories: { type: Type.NUMBER },
                  protein: { type: Type.NUMBER },
                  carbs: { type: Type.NUMBER },
                  fats: { type: Type.NUMBER },
                  sugar: { type: Type.NUMBER }
                },
                required: ["calories", "protein", "carbs", "fats", "sugar"]
              },
            },
            required: ["title", "description", "ingredients", "macros"]
          },
        },
      },
    });

    const data = JSON.parse(response.text || "[]");
    return data.map((r: any) => ({ ...r, id: `inspire-${Math.random().toString(36).substr(2, 9)}` }));
  } catch (error) {
    console.error("Error generating inspiration recipes:", error);
    return [];
  }
};

export const suggestRestockItems = async (userProfile: UserProfile | null, pantryItems: PantryItem[]): Promise<RestockSuggestion[]> => {
    const ai = getAI();
    const pantryNames = pantryItems.map(p => p.name).join(", ");
    
    let context = "General healthy eating.";
    if (userProfile) {
        context = `
        Goal: ${userProfile.goal}.
        Diet Type: ${userProfile.dietaryType}.
        Allergies/Restrictions: ${userProfile.allergies}.
        Weekly Budget: $${userProfile.weeklyBudget} (Try to fit within this).
        `;
    }

    try {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: `Analyze the User Profile: ${context} and Current Pantry: ${pantryNames}.
            
            Identify GAPS in their nutrition. 
            CRITICAL: Provide substantially filling items to build complete meals. 
            Do not just suggest snacks. Ensure there are proteins and main meal bases.
            
            Group into these 4 categories:
            1. 'Proteins & Mains': STRICTLY SUGGEST popular, substantial proteins like Steak, Chicken Breast, Ground Beef, Salmon, Eggs, Sausage, or Pork Chops. Do not suggest beans/lentils here unless the diet is Vegan/Vegetarian.
            2. 'Fresh Produce': Fruits & Vegetables missing from pantry.
            3. 'Pantry Staples': Grains, Spices, Oils, Sauces needed for cooking.
            4. 'Snacks & Other': Healthy options or specific goal boosters.

            Suggest 5-7 distinct items per category. Estimate price.
            `,
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.ARRAY,
                    items: {
                        type: Type.OBJECT,
                        properties: {
                            category: { type: Type.STRING, enum: ['Proteins & Mains', 'Fresh Produce', 'Pantry Staples', 'Snacks & Other'] },
                            items: {
                                type: Type.ARRAY,
                                items: {
                                    type: Type.OBJECT,
                                    properties: {
                                        name: { type: Type.STRING },
                                        quantity: { type: Type.STRING },
                                        estimatedPrice: { type: Type.NUMBER },
                                        category: { type: Type.STRING } 
                                    },
                                    required: ["name", "quantity", "estimatedPrice", "category"]
                                }
                            }
                        },
                        required: ["category", "items"]
                    }
                }
            }
        });
        const data = JSON.parse(response.text || "[]");
        return data; // Returns RestockSuggestion[]
    } catch (e) {
        console.error("Restock suggestion failed", e);
        return [];
    }
};

export const generateWeeklyPlan = async (pantryItems: PantryItem[], userProfile: UserProfile | null): Promise<DayPlan[]> => {
  const ai = getAI();
  const ingredientsList = pantryItems.map(i => i.name).join(", ").slice(0, 1500); 
  
  let dietInstructions = "";
  if (userProfile) {
      dietInstructions = `
      USER TARGETS: 
      - Daily Calories: ~${userProfile.targets.calories} kcal
      - Diet: ${userProfile.dietaryType}.
      - Allergies: ${userProfile.allergies}.`;
  }

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: `Create a 3-day meal plan using: ${ingredientsList}.
      ${dietInstructions}
      
      MANDATORY REQUIREMENTS:
      1. Return a JSON array for 3 days.
      2. EVERY Day object MUST contain strictly 3 keys: 'breakfast', 'lunch', 'dinner'. Keys must be lowercase.
      3. Do NOT output null for any meal. Generate a valid recipe for ALL 3 meals for ALL 3 days.
      4. Keep descriptions SHORT (max 15 words).
      5. Do not generate full ingredient lists or steps yet (save tokens).
      `,
      config: {
        temperature: 0.1, 
        responseMimeType: "application/json",
        maxOutputTokens: 8192, // High limit to ensure completion
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
                        missingIngredientsCount: { type: Type.NUMBER },
                        macros: {
                            type: Type.OBJECT,
                            properties: {
                              calories: { type: Type.NUMBER },
                              protein: { type: Type.NUMBER },
                              carbs: { type: Type.NUMBER },
                              fats: { type: Type.NUMBER },
                              sugar: { type: Type.NUMBER }
                            },
                            required: ["calories", "protein", "carbs", "fats", "sugar"]
                        }
                     },
                     required: ["title", "description", "macros", "missingIngredientsCount"]
                  },
                  lunch: {
                     type: Type.OBJECT,
                     properties: {
                        title: { type: Type.STRING },
                        description: { type: Type.STRING },
                        prepTimeMinutes: { type: Type.NUMBER },
                        missingIngredientsCount: { type: Type.NUMBER },
                        macros: {
                            type: Type.OBJECT,
                            properties: {
                              calories: { type: Type.NUMBER },
                              protein: { type: Type.NUMBER },
                              carbs: { type: Type.NUMBER },
                              fats: { type: Type.NUMBER },
                              sugar: { type: Type.NUMBER }
                            },
                            required: ["calories", "protein", "carbs", "fats", "sugar"]
                        }
                     },
                     required: ["title", "description", "macros", "missingIngredientsCount"]
                  },
                  dinner: {
                     type: Type.OBJECT,
                     properties: {
                        title: { type: Type.STRING },
                        description: { type: Type.STRING },
                        prepTimeMinutes: { type: Type.NUMBER },
                        missingIngredientsCount: { type: Type.NUMBER },
                        macros: {
                            type: Type.OBJECT,
                            properties: {
                              calories: { type: Type.NUMBER },
                              protein: { type: Type.NUMBER },
                              carbs: { type: Type.NUMBER },
                              fats: { type: Type.NUMBER },
                              sugar: { type: Type.NUMBER }
                            },
                            required: ["calories", "protein", "carbs", "fats", "sugar"]
                        }
                     },
                     required: ["title", "description", "macros", "missingIngredientsCount"]
                  },
                },
                required: ["breakfast", "lunch", "dinner"]
              }
            },
            required: ["day", "meals"]
          }
        }
      }
    });
    
    const text = response.text;
    if(!text) return [];
    return JSON.parse(text);
  } catch (e) {
    console.error("Plan generation failed", e);
    return [];
  }
};

export const getRecipeDetails = async (title: string, description: string, pantryItems: string[] = []): Promise<Partial<Recipe>> => {
    const ai = getAI();
    const pantryContext = pantryItems.length > 0 ? `My pantry has: ${pantryItems.join(', ')}.` : '';
    
    try {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: `For the recipe "${title}" (${description}).
            ${pantryContext}
            Generate:
            1. Detailed ingredients list with amounts.
            2. Step-by-step cooking instructions.
            3. A list of 'missingIngredients' (names of items required for the recipe that are NOT in my pantry).
            `,
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        ingredients: {
                            type: Type.ARRAY,
                            items: {
                                type: Type.OBJECT,
                                properties: {
                                    name: { type: Type.STRING },
                                    amount: { type: Type.STRING }
                                },
                                required: ["name", "amount"]
                            }
                        },
                        steps: {
                            type: Type.ARRAY,
                            items: { type: Type.STRING }
                        },
                        missingIngredients: {
                            type: Type.ARRAY,
                            items: { type: Type.STRING }
                        }
                    },
                    required: ["ingredients", "steps", "missingIngredients"]
                }
            }
        });
        return JSON.parse(response.text || "{}");
    } catch (e) {
        console.error("Details generation failed", e);
        return {};
    }
}

export const generateGroceryList = async (plan: DayPlan[], pantryItems: PantryItem[]): Promise<GroceryItem[]> => {
  const ai = getAI();
  // Extract titles if ingredients aren't fully loaded yet
  const planSummary = plan.map(d => ({
     day: d.day,
     meals: {
        breakfast: d.meals.breakfast?.title,
        lunch: d.meals.lunch?.title,
        dinner: d.meals.dinner?.title
     }
  }));
  
  const pantryStr = JSON.stringify(pantryItems.map(p => p.name));

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: `Based on this meal plan: ${JSON.stringify(planSummary)}, and my current pantry: ${pantryStr}, generate a grocery shopping list for missing items.
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

export const findNearbyRestaurants = async (latitude: number, longitude: number) => {
  const ai = getAI();
  try {
    const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: "Find 3 highly-rated healthy food options or grocery stores near me. List their names and why they are good options.",
        config: {
            tools: [{ googleMaps: {} }],
            toolConfig: {
                retrievalConfig: {
                    latLng: { latitude, longitude }
                }
            }
        }
    });
    return response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
  } catch (e) {
      console.error("Nearby search failed", e);
      return [];
  }
}
