// App State
let currentView = 'dashboard';
let currentDate = new Date(); // For calendar current month
let currentIngredients = [];
let currentRecipes = [];
let currentMealPlan = [];

// DOM Elements
const views = document.querySelectorAll('.view');
const navLinks = document.querySelectorAll('.nav-links li');
const modalOverlay = document.getElementById('modalOverlay');
const modalContainer = document.getElementById('modalContainer');

// --- Initialization ---
document.addEventListener('DOMContentLoaded', () => {
    setupNavigation();
    setupAuth();
    
    // Non-blocking data load
    loadData().then(() => {
        renderView(currentView);
    }).catch(err => {
        console.error("Initial load failed", err);
    });
    
    // Global Event Listeners - Attach these IMMEDIATELY
    document.getElementById('exportBtn').addEventListener('click', exportToExcel);
    document.getElementById('addIngredientBtn').addEventListener('click', showIngredientModal);
    document.getElementById('addRecipeBtn').addEventListener('click', () => showRecipeModal());
    document.getElementById('pasteRecipeBtn').addEventListener('click', showPasteRecipeModal);
    document.getElementById('importUrlBtn').addEventListener('click', showImportUrlModal);
    document.getElementById('importImageBtn').addEventListener('click', showImportImageModal);
    document.getElementById('addProfileBtn').addEventListener('click', showProfileModal);

    document.getElementById('prevMonth').addEventListener('click', () => changeMonth(-1));
    document.getElementById('nextMonth').addEventListener('click', () => changeMonth(1));
    document.getElementById('generatePlanBtn').addEventListener('click', generatePlan);
    
    // Auth Listeners
    document.getElementById('loginBtn').addEventListener('click', async () => {
        try {
            await dbAPI.login();
        } catch (e) {
            alert("Login failed. Make sure you've enabled Google Auth in Firebase Console.");
        }
    });
    if(document.getElementById('headerLoginBtn')) {
        document.getElementById('headerLoginBtn').addEventListener('click', async () => {
            try {
                await dbAPI.login();
            } catch (e) {
                alert("Login failed. Make sure you've enabled Google Auth in Firebase Console.");
            }
        });
    }
    document.getElementById('logoutBtn').addEventListener('click', () => dbAPI.logout());
    
    // Shopping List Event Listeners
    if(document.getElementById('generateShoppingListBtn')) {
        document.getElementById('generateShoppingListBtn').addEventListener('click', generateShoppingList);
        document.getElementById('exportShoppingListBtn').addEventListener('click', exportShoppingList);
    }
});

function setupAuth() {
    dbAPI.onAuth(async (user) => {
        const loginBtn = document.getElementById('loginBtn');
        const userProfile = document.getElementById('userProfile');
        const headerLoginBtn = document.getElementById('headerLoginBtn');
        const headerUserProfile = document.getElementById('headerUserProfile');
        
        if (user) {
            if(loginBtn) loginBtn.classList.add('hidden');
            if(userProfile) {
                userProfile.classList.remove('hidden');
                document.getElementById('userAvatar').src = user.photoURL || 'https://ui-avatars.com/api/?name=' + user.displayName;
                document.getElementById('userName').innerText = user.displayName;
            }
            if(headerLoginBtn) headerLoginBtn.classList.add('hidden');
            if(headerUserProfile) {
                headerUserProfile.classList.remove('hidden');
                document.getElementById('headerUserAvatar').src = user.photoURL || 'https://ui-avatars.com/api/?name=' + user.displayName;
            }
        } else {
            if(loginBtn) loginBtn.classList.remove('hidden');
            if(userProfile) userProfile.classList.add('hidden');
            if(headerLoginBtn) headerLoginBtn.classList.remove('hidden');
            if(headerUserProfile) headerUserProfile.classList.add('hidden');
        }
        
        // Reload data when auth changes
        loadData().then(() => {
            renderView(currentView);
        });
    });
}



// // --- Data Management ---
async function loadData() {
    try {
        await deduplicateIngredients();
        currentIngredients = await dbAPI.getAll('ingredients');

        
        // Seed common ingredients that aren't already in the list
        const seedData = [
            { name: 'Flour', unit: 'cup', calories: 455, cost: 0.10 },
            { name: 'Egg', unit: 'whole', calories: 70, cost: 0.25 },
            { name: 'Milk', unit: 'cup', calories: 150, cost: 0.50 },
            { name: 'Sugar', unit: 'cup', calories: 770, cost: 0.15 },
            { name: 'Butter', unit: 'tbsp', calories: 100, cost: 0.12 },
            { name: 'Chicken Breast', unit: 'oz', calories: 45, cost: 0.35 },
            { name: 'Ground Beef', unit: 'oz', calories: 70, cost: 0.45 },
            { name: 'Cheddar Cheese', unit: 'oz', calories: 115, cost: 0.25 },
            { name: 'Bread Crumbs', unit: 'cup', calories: 400, cost: 0.30 },
            { name: 'Rice', unit: 'cup', calories: 680, cost: 0.20 },
            { name: 'Pasta', unit: 'oz', calories: 100, cost: 0.10 },
            { name: 'Olive Oil', unit: 'tbsp', calories: 120, cost: 0.15 },
            { name: 'Onion', unit: 'whole', calories: 40, cost: 0.50 },
            { name: 'Garlic', unit: 'clove', calories: 5, cost: 0.10 },
            { name: 'Tomato Sauce', unit: 'oz', calories: 15, cost: 0.08 },
            { name: 'Potato', unit: 'whole', calories: 160, cost: 0.40 },
            { name: 'Salt', unit: 'tsp', calories: 0, cost: 0.01 },
            { name: 'Black Pepper', unit: 'tsp', calories: 5, cost: 0.05 },
            { name: 'Water', unit: 'cup', calories: 0, cost: 0.00 },
            { name: 'Bacon', unit: 'slice', calories: 45, cost: 0.40 },
            { name: 'Greek Yogurt', unit: 'oz', calories: 20, cost: 0.15 },
            { name: 'Honey', unit: 'tbsp', calories: 60, cost: 0.20 },
            { name: 'Soy Sauce', unit: 'tbsp', calories: 10, cost: 0.10 },
            { name: 'Lemon', unit: 'whole', calories: 20, cost: 0.60 },
            // Spices & Herbs
            { name: 'Cinnamon', unit: 'tsp', calories: 6, cost: 0.05 },
            { name: 'Paprika', unit: 'tsp', calories: 6, cost: 0.05 },
            { name: 'Cumin', unit: 'tsp', calories: 8, cost: 0.05 },
            { name: 'Dried Oregano', unit: 'tsp', calories: 5, cost: 0.05 },
            { name: 'Dried Basil', unit: 'tsp', calories: 5, cost: 0.05 },
            { name: 'Chili Powder', unit: 'tsp', calories: 8, cost: 0.05 },
            { name: 'Red Pepper Flakes', unit: 'tsp', calories: 6, cost: 0.05 },
            { name: 'Parsley (Fresh)', unit: 'oz', calories: 10, cost: 0.80 },
            { name: 'Cilantro (Fresh)', unit: 'oz', calories: 10, cost: 0.80 },
            // Dressings & Condiments
            { name: 'Ranch Dressing', unit: 'tbsp', calories: 70, cost: 0.12 },
            { name: 'Ketchup', unit: 'tbsp', calories: 15, cost: 0.05 },
            { name: 'Mayonnaise', unit: 'tbsp', calories: 90, cost: 0.10 },
            { name: 'Mustard', unit: 'tsp', calories: 5, cost: 0.03 },
            { name: 'Balsamic Vinegar', unit: 'tbsp', calories: 15, cost: 0.15 },
            // More Produce
            { name: 'Corn (Canned)', unit: 'oz', calories: 20, cost: 0.10 },
            { name: 'Black Beans', unit: 'oz', calories: 25, cost: 0.12 },
            { name: 'Lettuce (Iceberg)', unit: 'head', calories: 75, cost: 1.50 },
            { name: 'Cabbage', unit: 'lb', calories: 110, cost: 0.80 },
            { name: 'Carrot', unit: 'whole', calories: 30, cost: 0.25 },
            { name: 'Bell Pepper', unit: 'whole', calories: 30, cost: 1.00 },
            { name: 'Broccoli', unit: 'lb', calories: 150, cost: 1.80 },
            { name: 'Spinach', unit: 'oz', calories: 7, cost: 0.40 },
            { name: 'Cucumber', unit: 'whole', calories: 45, cost: 0.70 },
            // Oils, Fats & Shortenings
            { name: 'Vegetable Oil', unit: 'tbsp', calories: 120, cost: 0.08 },
            { name: 'Canola Oil', unit: 'tbsp', calories: 120, cost: 0.08 },
            { name: 'Lard', unit: 'tbsp', calories: 115, cost: 0.10 },
            { name: 'Vegetable Shortening', unit: 'tbsp', calories: 110, cost: 0.12 },
            { name: 'Coconut Oil', unit: 'tbsp', calories: 120, cost: 0.25 },
            // More Baking & Staples
            { name: 'Brown Sugar', unit: 'cup', calories: 830, cost: 0.20 },
            { name: 'Yeast (Active Dry)', unit: 'tsp', calories: 15, cost: 0.10 },
            { name: 'Baking Powder', unit: 'tsp', calories: 2, cost: 0.05 },
            { name: 'Baking Soda', unit: 'tsp', calories: 0, cost: 0.03 },
            { name: 'Vanilla Extract', unit: 'tsp', calories: 12, cost: 0.50 },
            { name: 'Cocoa Powder', unit: 'cup', calories: 200, cost: 0.80 },
            { name: 'Chocolate Chips', unit: 'cup', calories: 800, cost: 1.50 },
            // More Veggies & Legumes
            { name: 'Peas (Frozen)', unit: 'oz', calories: 22, cost: 0.10 },
            { name: 'Green Beans', unit: 'oz', calories: 9, cost: 0.15 },
            { name: 'Chickpeas', unit: 'oz', calories: 45, cost: 0.12 },
            { name: 'Lentils', unit: 'oz', calories: 32, cost: 0.10 },
            // Asian (Chinese/Japanese/Thai)
            { name: 'Sesame Oil', unit: 'tbsp', calories: 120, cost: 0.30 },
            { name: 'Ginger (Fresh)', unit: 'oz', calories: 22, cost: 0.50 },
            { name: 'Rice Vinegar', unit: 'tbsp', calories: 3, cost: 0.12 },
            { name: 'Fish Sauce', unit: 'tbsp', calories: 10, cost: 0.20 },
            { name: 'Miso Paste', unit: 'tbsp', calories: 35, cost: 0.40 },
            { name: 'Hoisin Sauce', unit: 'tbsp', calories: 35, cost: 0.15 },
            { name: 'Rice Noodles', unit: 'oz', calories: 100, cost: 0.25 },
            // Mexican
            { name: 'Corn Tortillas', unit: 'whole', calories: 50, cost: 0.10 },
            { name: 'Flour Tortillas', unit: 'whole', calories: 140, cost: 0.20 },
            { name: 'Salsa', unit: 'oz', calories: 10, cost: 0.15 },
            { name: 'Avocado', unit: 'whole', calories: 240, cost: 1.50 },
            { name: 'Jalapeño', unit: 'whole', calories: 5, cost: 0.20 },
            { name: 'Sour Cream', unit: 'tbsp', calories: 30, cost: 0.10 },
            { name: 'Taco Seasoning', unit: 'tsp', calories: 10, cost: 0.05 },
            // Italian
            { name: 'Parmesan Cheese', unit: 'oz', calories: 110, cost: 0.50 },
            { name: 'Mozzarella Cheese', unit: 'oz', calories: 85, cost: 0.30 },
            { name: 'Ricotta Cheese', unit: 'oz', calories: 50, cost: 0.25 },
            { name: 'Fresh Basil', unit: 'oz', calories: 7, cost: 1.20 },
            { name: 'Pesto', unit: 'tbsp', calories: 80, cost: 0.40 }
        ];

        let addedAny = false;
        for (const item of seedData) {
            const exists = currentIngredients.find(i => i.name.toLowerCase() === item.name.toLowerCase());
            if (!exists) {
                item.id = 'ing_' + Date.now() + Math.random().toString(36).substr(2, 5);
                await dbAPI.add('ingredients', item);
                addedAny = true;
            }
        }
        
        if (addedAny) {
            currentIngredients = await dbAPI.getAll('ingredients');
        }

        currentRecipes = await dbAPI.getAll('recipes');
        currentMealPlan = await dbAPI.getAll('mealPlan');
        updateDashboard();
        
        // Check for shared recipe in URL
        const urlParams = new URLSearchParams(window.location.search);
        const sharedRecipeId = urlParams.get('recipeId');
        if (sharedRecipeId && currentView === 'dashboard') {
            handleSharedRecipe(sharedRecipeId);
        }
    } catch (error) {
        console.error("Firestore loading error:", error);
        if (error.message && (error.message.includes('permission-denied') || error.message.includes('API has not been used'))) {
            alert("Firestore API is not enabled yet. Please click the link I sent you in the chat to enable it in your Google Cloud Console!");
        }
    }
}


async function handleSharedRecipe(recipeId) {
    try {
        const recipe = await dbAPI.getOne('recipes', recipeId);
        if (recipe) {
            // Ask user to save it
            if(confirm(`Someone shared a recipe with you: "${recipe.name}". Would you like to save it?`)) {
                // Ensure we don't duplicate id
                recipe.id = 'rec_' + Date.now();
                await dbAPI.add('recipes', recipe);
                await loadData();
                switchView('recipes');
                alert("Recipe saved successfully!");
            }
        }
        
        // Clear URL so it doesn't prompt on refresh
        window.history.replaceState({}, document.title, window.location.pathname);
    } catch(e) {
        console.error("Error fetching shared recipe", e);
    }
}

async function deduplicateIngredients() {
    const ings = await dbAPI.getAll('ingredients');
    const seen = new Map();
    const duplicates = [];

    ings.forEach(ing => {
        let name = ing.name.toLowerCase().trim();
        // Basic plural handling (remove trailing s)
        if (name.endsWith('s') && name.length > 3) name = name.slice(0, -1);
        
        if (seen.has(name)) {
            duplicates.push(ing.id);
        } else {
            seen.set(name, ing.id);
        }
    });

    if (duplicates.length > 0) {
        console.log(`Cleaning up ${duplicates.length} duplicate ingredients...`);
        for (const id of duplicates) {
            await dbAPI.delete('ingredients', id);
        }
        return duplicates.length;
    }
    return 0;
}

async function manualCleanup() {
    const count = await deduplicateIngredients();
    if (count > 0) {
        alert(`Cleaned up ${count} duplicate ingredients!`);
        await loadData();
        renderIngredients();
    } else {
        alert("No duplicates found.");
    }
}

// --- Navigation ---

function setupNavigation() {
    navLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            try {
                navLinks.forEach(l => l.classList.remove('active'));
                const target = e.currentTarget;
                target.classList.add('active');
                
                const viewId = target.getAttribute('data-view');
                console.log("Switching to view:", viewId);
                switchView(viewId);
            } catch (err) {
                console.error("Navigation error:", err);
            }
        });
    });
}

function switchView(viewId) {
    views.forEach(v => v.classList.remove('active-view'));
    const target = document.getElementById('view-' + viewId);
    if (target) {
        target.classList.add('active-view');
    } else {
        console.error("View element not found: view-" + viewId);
    }
    
    // Update Header Title
    const headerTitle = document.querySelector('.top-header h2');
    if (headerTitle) {
        const titleMap = {
            'dashboard': 'Dashboard',
            'calendar': 'Meal Calendar',
            'shopping-list': 'Shopping List',
            'recipes': 'Recipes',
            'ingredients': 'Ingredients',
            'profiles': 'User Profiles'
        };
        headerTitle.innerText = titleMap[viewId] || 'PlanEats';
    }

    currentView = viewId;
    renderView(viewId);
}

function renderView(viewId) {
    switch (viewId) {
        case 'dashboard': updateDashboard(); break;
        case 'calendar': renderCalendar(); break;
        case 'ingredients': renderIngredients(); break;
        case 'recipes': renderRecipes(); break;
        case 'profiles': renderProfiles(); break;
        case 'shopping-list': /* Shopping list doesn't auto render */ break;
    }
}

function closeModal() {
    modalOverlay.classList.add('hidden');
    setTimeout(() => { modalContainer.innerHTML = ''; }, 300);
}

// --- Dashboard ---
function updateDashboard() {
    const totalRecipes = currentRecipes.length;
    document.getElementById('stat-recipes').innerText = totalRecipes;
    
    let dailyCalTotal = 0;
    let monthlyCostTotal = 0;
    
    // Calculate naive averages from meal plan
    if(currentMealPlan.length > 0) {
        // ... (can be detailed later based on actual plans)
    }
    document.getElementById('stat-calories').innerText = dailyCalTotal + ' kcal';
    document.getElementById('stat-cost').innerText = '$' + monthlyCostTotal.toFixed(2);
}

// --- Ingredients View ---
function renderIngredients() {
    const tbody = document.getElementById('ingredientsList');
    tbody.innerHTML = '';
    
    // Add header with cleanup button if not already there or just manage the parent
    const view = document.getElementById('view-ingredients');
    if (!document.getElementById('ingHeader')) {
        const header = document.createElement('div');
        header.id = 'ingHeader';
        header.style = "display:flex; justify-content:space-between; align-items:center; margin-bottom: 20px;";
        header.innerHTML = `
            <h2>Ingredients</h2>
            <div style="display:flex; gap:10px;">
                <button class="btn outline-btn" onclick="manualCleanup()"><i class="fa-solid fa-broom"></i> Clean Duplicates</button>
                <button class="btn primary-btn" onclick="showIngredientModal()"><i class="fa-solid fa-plus"></i> Add New</button>
            </div>
        `;
        view.insertBefore(header, view.firstChild);
        // Hide the original h2/button if they exist in HTML
        const oldH2 = view.querySelector('h2:not(#ingHeader h2)');
        const oldBtn = view.querySelector('.primary-btn:not(#ingHeader .primary-btn)');
        if(oldH2) oldH2.style.display = 'none';
        if(oldBtn) oldBtn.style.display = 'none';
    }

    currentIngredients.forEach(ing => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${ing.name}</td>
            <td>${ing.unit}</td>
            <td>${ing.calories}</td>
            <td>$${parseFloat(ing.cost).toFixed(2)}</td>
            <td>
                <button class="action-btn" onclick="deleteIngredient('${ing.id}')"><i class="fa-solid fa-trash"></i></button>
            </td>
        `;
        tbody.appendChild(tr);
    });
}

function showIngredientModal() {
    modalContainer.innerHTML = `
        <h2>Add Ingredient</h2>
        <form id="ingredientForm">
            <div class="form-group">
                <label>Name</label>
                <input type="text" id="ingName" required>
            </div>
            <div class="form-group">
                <label>Unit (e.g., oz, cup, whole)</label>
                <input type="text" id="ingUnit" required>
            </div>
            <div class="form-group">
                <label>Calories per Unit</label>
                <input type="number" id="ingCalories" required>
            </div>
            <div class="form-group">
                <label>Cost per Unit ($)</label>
                <input type="number" step="0.01" id="ingCost" required>
            </div>
            <div style="display:flex; gap: 10px; margin-top:20px;">
                <button type="submit" class="btn primary-btn">Save</button>
                <button type="button" class="btn icon-btn" onclick="closeModal()">Cancel</button>
            </div>
        </form>
    `;
    modalOverlay.classList.remove('hidden');
    
    document.getElementById('ingredientForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        const newIng = {
            id: 'ing_' + Date.now(),
            name: document.getElementById('ingName').value,
            unit: document.getElementById('ingUnit').value,
            calories: parseFloat(document.getElementById('ingCalories').value),
            cost: parseFloat(document.getElementById('ingCost').value)
        };
        await dbAPI.add('ingredients', newIng);
        await loadData();
        closeModal();
        renderIngredients();
    });
}

async function deleteIngredient(id) {
    await dbAPI.delete('ingredients', id);
    await loadData();
    renderIngredients();
}

// --- Recipes View ---
function renderRecipes() {
    const grid = document.getElementById('recipesList');
    grid.innerHTML = '';
    currentRecipes.forEach(recipe => {
        const el = document.createElement('div');
        el.className = 'recipe-card glass-panel';
        
        let tagsHtml = recipe.categories.map(c => `<span class="tag">${c}</span>`).join('');
        
        // Compute Cost & Calories safely
        let totalCost = 0;
        let totalCals = 0;
        
        recipe.ingredients.forEach(ri => {
            const ing = currentIngredients.find(i => i.id === ri.ingredientId);
            if(ing) {
                totalCost += (ing.cost * ri.quantity);
                totalCals += (ing.calories * ri.quantity);
            }
        });
        
        let perServingCost = recipe.servings > 0 ? (totalCost / recipe.servings) : 0;
        let perServingCals = recipe.servings > 0 ? (totalCals / recipe.servings) : 0;

        el.innerHTML = `
            <div style="display:flex; justify-content:space-between; align-items:flex-start;">
                <h3>${recipe.name}</h3>
                <div>
                    <button class="action-btn text-accent" title="Edit" onclick="editRecipe('${recipe.id}')"><i class="fa-solid fa-pen-to-square"></i></button>
                    <button class="action-btn text-accent" title="Share" onclick="shareRecipe('${recipe.id}')"><i class="fa-solid fa-share-nodes"></i></button>
                    <button class="action-btn" title="Delete" onclick="deleteRecipe('${recipe.id}')"><i class="fa-solid fa-trash"></i></button>
                </div>
            </div>
            <div class="recipe-tags">${tagsHtml}</div>
            <p style="font-size: 0.9rem; color: var(--text-secondary);">Servings: ${recipe.servings}</p>
            <div style="margin-top: 10px; font-size: 0.85rem; border-top: 1px solid var(--border-color); padding-top: 10px;">
                <p><i class="fa-solid fa-fire text-accent"></i> ${perServingCals.toFixed(0)} kcal / serving</p>
                <p><i class="fa-solid fa-sack-dollar text-accent"></i> $${perServingCost.toFixed(2)} / serving</p>
            </div>
        `;
        grid.appendChild(el);
    });
}

function shareRecipe(id) {
    const url = new URL(window.location.href);
    url.searchParams.set('recipeId', id);
    navigator.clipboard.writeText(url.toString()).then(() => {
        alert("Share link copied to clipboard!");
    });
}

function showRecipeModal(initialName = '', initialIngredients = [], existingRecipeId = null) {
    modalContainer.innerHTML = `
        <h2>${existingRecipeId ? 'Edit' : 'New'} Recipe</h2>
        <form id="recipeForm">
            <div class="form-group">
                <label>Recipe Name</label>
                <input type="text" id="recipeName" required value="${initialName}">
            </div>
            <div class="form-group">
                <label>Servings</label>
                <input type="number" id="recipeServings" value="2" required>
            </div>
            <div class="form-group">
                <label>Categories</label>
                <div id="categoryButtons" class="category-toggle-container">
                    <button type="button" class="category-btn" data-value="Breakfast">Breakfast</button>
                    <button type="button" class="category-btn" data-value="Lunch">Lunch</button>
                    <button type="button" class="category-btn" data-value="Dinner">Dinner</button>
                </div>
                <input type="hidden" id="recipeCategories" required>
            </div>
            
            <div style="margin-top:20px; border-top: 1px solid var(--border-color); padding-top: 10px;">
                <h3>Ingredients</h3>
                <div id="recipeIngList"></div>
                <div style="display:flex; gap: 10px; margin-top: 10px;">
                    <select id="ingSelect" class="form-control" style="flex: 1;">
                        ${currentIngredients.length > 0 ? 
                            currentIngredients.map(i => `<option value="${i.id}">${i.name} (${i.unit})</option>`).join('') :
                            '<option value="">No ingredients found - Add some first!</option>'
                        }
                    </select>
                    <input type="number" id="ingQty" placeholder="Qty" style="width: 100px;" class="form-control">
                    <button type="button" id="addRecipeIngBtn" class="btn icon-btn"><i class="fa-solid fa-plus"></i></button>
                </div>
            </div>


            <div style="display:flex; gap: 10px; margin-top:20px;">
                <button type="submit" class="btn primary-btn">Save Recipe</button>
                <button type="button" class="btn icon-btn" onclick="closeModal()">Cancel</button>
            </div>
        </form>
    `;
    modalOverlay.classList.remove('hidden');
    
    let selectedIngredients = [...initialIngredients];
    let selectedCategories = [];
    
    // Setup Category Toggles
    const catBtns = document.querySelectorAll('.category-btn');
    catBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            btn.classList.toggle('active');
            updateCategories();
        });
    });

    function updateCategories() {
        selectedCategories = Array.from(document.querySelectorAll('.category-btn.active')).map(b => b.getAttribute('data-value'));
        document.getElementById('recipeCategories').value = selectedCategories.join(',');
    }

    // Initial preview if pasted or editing
    if(selectedIngredients.length > 0) {
        updateRecipeIngPreview();
    }
    
    document.getElementById('addRecipeIngBtn').addEventListener('click', () => {
        const id = document.getElementById('ingSelect').value;
        const qty = parseFloat(document.getElementById('ingQty').value);
        if(!id || !qty) return;
        
        const existing = selectedIngredients.find(s => s.ingredientId === id);
        if(existing) existing.quantity += qty;
        else selectedIngredients.push({ ingredientId: id, quantity: qty });
        
        updateRecipeIngPreview();
    });

    function updateRecipeIngPreview() {
        const list = document.getElementById('recipeIngList');
        list.innerHTML = selectedIngredients.map((s, idx) => {
            const ing = currentIngredients.find(i => i.id === s.ingredientId);
            const name = ing ? ing.name : "(Unknown Ingredient)";
            return `
                <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:5px; font-size:0.9rem; background: rgba(255,255,255,0.05); padding: 5px 10px; border-radius:5px;">
                    <span>${s.quantity} x ${name}</span>
                    <button type="button" class="action-btn" onclick="removeIngFromRecipe(${idx})" style="color:var(--accent);"><i class="fa-solid fa-xmark"></i></button>
                </div>
            `;
        }).join('');
    }

    window.removeIngFromRecipe = (idx) => {
        selectedIngredients.splice(idx, 1);
        updateRecipeIngPreview();
    };

    document.getElementById('recipeForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        
        if (selectedCategories.length === 0) {
            alert("Please select at least one category.");
            return;
        }

        const newRecipe = {
            id: existingRecipeId || ('rec_' + Date.now()),
            name: document.getElementById('recipeName').value,
            servings: parseInt(document.getElementById('recipeServings').value),
            categories: selectedCategories,
            ingredients: selectedIngredients
        };
        await dbAPI.add('recipes', newRecipe);
        await loadData();
        closeModal();
        renderRecipes();
    });
}

function editRecipe(id) {
    const recipe = currentRecipes.find(r => r.id === id);
    if (recipe) {
        showRecipeModal(recipe.name, recipe.ingredients, recipe.id);
        // Pre-fill categories and servings
        setTimeout(() => {
            document.getElementById('recipeServings').value = recipe.servings;
            const catBtns = document.querySelectorAll('.category-btn');
            catBtns.forEach(btn => {
                if (recipe.categories.includes(btn.getAttribute('data-value'))) {
                    btn.classList.add('active');
                }
            });
            // Trigger hidden field update
            const activeCats = Array.from(document.querySelectorAll('.category-btn.active')).map(b => b.getAttribute('data-value'));
            document.getElementById('recipeCategories').value = activeCats.join(',');
        }, 50);
    }
}

async function deleteRecipe(id) {
    await dbAPI.delete('recipes', id);
    await loadData();
    renderRecipes();
}

function showImportUrlModal() {
    modalContainer.innerHTML = `
        <h2>Import from URL</h2>
        <p style="color:var(--text-secondary); margin-bottom: 15px;">Enter the URL of a recipe website (e.g., AllRecipes, FoodNetwork, etc.). We will try to extract the ingredients and servings automatically.</p>
        <div class="form-group">
            <label>Recipe URL</label>
            <input type="url" id="importUrlInput" placeholder="https://www.allrecipes.com/recipe/..." class="form-control">
        </div>
        <div class="form-group">
            <label>Missing something? Paste extra ingredients here</label>
            <textarea id="importManualText" rows="5" placeholder="Example:\n1 tsp salt\n2 eggs" class="form-control"></textarea>
        </div>
        <div id="importStatus" style="margin-top: 10px; font-size: 0.9rem; color: var(--accent);" class="hidden">Parsing website... this may take a few seconds.</div>
        <div style="display:flex; gap: 10px; margin-top:20px;">
            <button class="btn primary-btn" id="startImportBtn">Scan & Merge</button>
            <button class="btn icon-btn" onclick="closeModal()">Cancel</button>
        </div>
    `;
    modalOverlay.classList.remove('hidden');

    document.getElementById('startImportBtn').addEventListener('click', async () => {
        const url = document.getElementById('importUrlInput').value;
        if(!url) return;
        
        const status = document.getElementById('importStatus');
        status.classList.remove('hidden');
        
        try {
            let html = "";
            let response;
            
            // Try Proxy 1
            try {
                const proxyUrl = `https://corsproxy.io/?${encodeURIComponent(url)}`;
                response = await fetch(proxyUrl);
                html = await response.text();
            } catch (e) { console.warn("Proxy 1 failed, trying fallback..."); }

            // Fallback Proxy if Proxy 1 failed or returned an error page
            if (!html || html.toLowerCase().includes('oops') || html.toLowerCase().includes('not right') || html.toLowerCase().includes('denied')) {
                const fallbackUrl = `https://api.allorigins.win/get?url=${encodeURIComponent(url)}`;
                response = await fetch(fallbackUrl);
                const json = await response.json();
                html = json.contents;
            }
            
            const parser = new DOMParser();
            const doc = parser.parseFromString(html, 'text/html');
            
            if (!doc.body || doc.body.innerText.length < 200) {
                throw new Error("Page content too short or blocked");
            }

            let recipeData = {
                name: (doc.querySelector('h1') ? doc.querySelector('h1').innerText : doc.title).split('|')[0].split('-')[0].trim(),
                ingredients: [],
                servings: 2
            };
            
            // Look for JSON-LD (Schema.org Recipe)
            const scripts = doc.querySelectorAll('script[type="application/ld+json"]');
            let foundSchema = false;
            
            for (const script of scripts) {
                try {
                    const json = JSON.parse(script.innerHTML);
                    const findRecipe = (obj) => {
                        if (obj['@type'] === 'Recipe') return obj;
                        if (Array.isArray(obj)) {
                            for (let item of obj) {
                                if (item['@type'] === 'Recipe') return item;
                                if (item['@graph']) {
                                    const res = findRecipe(item['@graph']);
                                    if (res) return res;
                                }
                            }
                        }
                        if (obj['@graph']) return findRecipe(obj['@graph']);
                        return null;
                    };
                    
                    const recipeSchema = findRecipe(json);
                    if (recipeSchema) {
                        recipeData.name = recipeSchema.name || recipeData.name;
                        recipeData.servings = parseInt(recipeSchema.recipeYield) || 2;
                        
                        if (recipeSchema.recipeIngredient) {
                            recipeData.ingredients = await parseIngredientStrings(recipeSchema.recipeIngredient);
                            foundSchema = true;
                        }
                    }
                } catch (e) {}
            }
            
            if(!foundSchema) {
                // Fallback: search for ingredients in the DOM
                console.log("Structured data not found, searching DOM...");
                
                // Try common ingredient selectors
                const ingSelectors = ['.ingredients', '.recipe-ingredients', '.wprm-recipe-ingredient', '.recipe-ingred-list', '[class*="ingredients"] li'];
                let itemsFound = [];
                
                ingSelectors.forEach(sel => {
                    if (itemsFound.length > 0) return;
                    const items = doc.querySelectorAll(sel);
                    if (items.length > 2) {
                        items.forEach(li => {
                            const text = li.innerText.trim();
                            if (text.length > 2 && text.length < 200) {
                                itemsFound.push(text);
                            }
                        });
                    }
                });

                if (itemsFound.length === 0) {
                    // Final fallback: any list with numbers
                    const lists = doc.querySelectorAll('ul, ol');
                    lists.forEach(list => {
                        const items = list.querySelectorAll('li');
                        if(items.length > 3 && items.length < 40) {
                            items.forEach(li => {
                                const text = li.innerText.trim();
                                if(text.match(/^[0-9\/\s]+/) || text.length > 5) {
                                    itemsFound.push(text);
                                }
                            });
                        }
                    });
                }

                if(itemsFound.length > 0) {
                    // Filter out duplicates and junk
                    const uniqueItems = [...new Set(itemsFound)].filter(t => t.length > 0);
                    recipeData.ingredients = await parseIngredientStrings(uniqueItems);
                }
            }

            // --- MERGE MANUAL TEXT ---
            const manualText = document.getElementById('importManualText').value;
            if (manualText) {
                const manualLines = manualText.split(/\r?\n/).map(l => l.trim()).filter(l => l.length > 0);
                const manualIngredients = await parseIngredientStrings(manualLines);
                
                // Add manual ingredients if not already present from URL
                manualIngredients.forEach(mIng => {
                    const exists = recipeData.ingredients.find(rIng => rIng.ingredientId === mIng.ingredientId);
                    if (!exists) {
                        recipeData.ingredients.push(mIng);
                    }
                });
            }
            
            status.classList.add('hidden');
            showRecipeModal(recipeData.name, recipeData.ingredients, recipeData.servings);
            
        } catch (e) {
            console.error(e);
            status.classList.add('hidden');
            
            const manualText = document.getElementById('importManualText').value;
            if (manualText) {
                alert("The website blocked the automatic scan, but we'll use your pasted ingredients!");
                const manualLines = manualText.split(/\r?\n/).map(l => l.trim()).filter(l => l.length > 0);
                const manualIngredients = await parseIngredientStrings(manualLines);
                showRecipeModal("New Recipe", manualIngredients);
            } else {
                alert("The website blocked the automatic scan. You can now enter the details manually.");
                showRecipeModal("New Recipe", []);
            }
        }
    });
}

function showImportImageModal() {
    modalContainer.innerHTML = `
        <h2>Import from Image (OCR)</h2>
        <p style="color:var(--text-secondary); margin-bottom: 15px;">Upload a photo of a recipe or ingredient list. We will use OCR to extract the text.</p>
        <div class="form-group">
            <label>Select Image</label>
            <input type="file" id="importImageInput" accept="image/*" class="form-control">
        </div>
        <div id="imagePreviewContainer" class="hidden" style="margin-bottom: 15px; text-align: center;">
            <img id="importImagePreview" style="max-width: 100%; max-height: 200px; border-radius: 8px; border: 1px solid var(--border);">
        </div>
        <div id="ocrStatus" style="margin-top: 10px; font-size: 0.9rem; color: var(--accent);" class="hidden">
            <i class="fa-solid fa-spinner fa-spin"></i> <span id="ocrStatusText">Reading image...</span>
        </div>
        <div style="display:flex; gap: 10px; margin-top:20px;">
            <button class="btn primary-btn" id="startOcrBtn" disabled>Start Scan</button>
            <button class="btn icon-btn" onclick="closeModal()">Cancel</button>
        </div>
    `;
    modalOverlay.classList.remove('hidden');

    const input = document.getElementById('importImageInput');
    const preview = document.getElementById('importImagePreview');
    const previewContainer = document.getElementById('imagePreviewContainer');
    const startBtn = document.getElementById('startOcrBtn');

    input.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (re) => {
                preview.src = re.target.result;
                previewContainer.classList.remove('hidden');
                startBtn.disabled = false;
            };
            reader.readAsDataURL(file);
        }
    });

    startBtn.addEventListener('click', async () => {
        const status = document.getElementById('ocrStatus');
        const statusText = document.getElementById('ocrStatusText');
        status.classList.remove('hidden');
        startBtn.disabled = true;

        try {
            const { data: { text } } = await Tesseract.recognize(
                preview.src,
                'eng',
                { logger: m => {
                    if(m.status === 'recognizing text') {
                        statusText.innerText = `Scanning: ${Math.round(m.progress * 100)}%`;
                    }
                } }
            );

            console.log("OCR Result:", text);
            const lines = text.split(/\r?\n/).map(l => l.trim()).filter(l => l.length > 5);
            const ingredients = await parseIngredientStrings(lines);
            
            status.classList.add('hidden');
            showRecipeModal("Image Import", ingredients);
        } catch (e) {
            console.error(e);
            alert("Failed to read image. Please make sure the text is clear.");
            status.classList.add('hidden');
            startBtn.disabled = false;
        }
    });
}

async function parseIngredientStrings(strings) {
    let parsed = [];
    for (const line of strings) {
        // Robust regex for quantities (Optional quantity)
        const match = line.match(/^([\d\s\.\/\-\u00BC-\u00BE\u2150-\u215E]*)\s*(.*)/);
        if(match && match[2].trim().length > 0) {
            let qtyStr = (match[1] || "").trim();
            let rest = match[2].trim();
            
            let qty = 1;
            try {
                if(qtyStr.includes('/')) {
                    const parts = qtyStr.split('/');
                    qty = parseFloat(parts[0]) / parseFloat(parts[1]);
                } else if(qtyStr.includes(' ')) {
                    const parts = qtyStr.split(' ');
                    qty = parts.reduce((acc, p) => acc + (p.includes('/') ? (p.split('/')[0]/p.split('/')[1]) : parseFloat(p)), 0);
                } else {
                    qty = parseFloat(qtyStr);
                }
            } catch(e) {}
            
            if(isNaN(qty)) qty = 1;

            let bestMatchId = null;
            let bestMatchScore = 0;
            currentIngredients.forEach(ing => {
                if(rest.toLowerCase().includes(ing.name.toLowerCase())) {
                    let score = ing.name.length;
                    if(score > bestMatchScore) {
                        bestMatchScore = score;
                        bestMatchId = ing.id;
                    }
                }
            });
            
            if(!bestMatchId) {
                // Auto-create missing ingredient
                const info = extractIngredientInfo(rest);
                const newIng = {
                    id: 'ing_' + Date.now() + Math.random().toString(36).substr(2, 5),
                    name: info.name,
                    unit: info.unit,
                    calories: guessCalories(info.name, info.unit),
                    cost: 0.25
                };
                await dbAPI.add('ingredients', newIng);
                currentIngredients.push(newIng);
                bestMatchId = newIng.id;
                console.log(`Auto-created ingredient: ${newIng.name}`);
            }

            if(bestMatchId) {
                let existing = parsed.find(p => p.ingredientId === bestMatchId);
                if(existing) existing.quantity += qty;
                else parsed.push({ ingredientId: bestMatchId, quantity: qty });
            }
        }
    }
    return parsed;
}

function extractIngredientInfo(str) {
    const units = ['cup', 'cups', 'oz', 'ounce', 'ounces', 'tsp', 'teaspoon', 'teaspoons', 'tbsp', 'tablespoon', 'tablespoons', 'lb', 'pound', 'pounds', 'g', 'gram', 'grams', 'kg', 'ml', 'liter', 'whole', 'clove', 'cloves', 'slice', 'slices'];
    let words = str.toLowerCase().split(' ');
    let unit = 'unit';
    let nameWords = [];

    let foundUnit = false;
    words.forEach(word => {
        const cleanWord = word.replace(/[(),]/g, '');
        if (!foundUnit && units.includes(cleanWord)) {
            unit = cleanWord;
            foundUnit = true;
        } else if (word !== 'of' && word !== 'and') {
            nameWords.push(word);
        }
    });

    return {
        unit: unit,
        name: nameWords.join(' ').charAt(0).toUpperCase() + nameWords.join(' ').slice(1)
    };
}

function guessCalories(name, unit) {
    const n = name.toLowerCase();
    // Simple heuristic map
    if (n.includes('oil') || n.includes('butter') || n.includes('fat')) return 120; // per tbsp/unit
    if (n.includes('sugar') || n.includes('honey') || n.includes('syrup')) return 60;
    if (n.includes('flour') || n.includes('rice') || n.includes('pasta')) return 400; // per cup
    if (n.includes('chicken') || n.includes('beef') || n.includes('pork') || n.includes('meat')) return 250; // per 4oz/unit
    if (n.includes('cheese') || n.includes('milk') || n.includes('cream')) return 100;
    if (n.includes('egg')) return 70;
    if (n.includes('vegetable') || n.includes('onion') || n.includes('garlic') || n.includes('pepper') || n.includes('lettuce')) return 20;
    if (n.includes('fruit') || n.includes('apple') || n.includes('banana') || n.includes('berry')) return 80;
    if (n.includes('nut') || n.includes('seed')) return 160;
    return 100; // Default fallback
}

function showPasteRecipeModal() {

    modalContainer.innerHTML = `
        <h2>Paste Recipe</h2>
        <p style="color:var(--text-secondary); margin-bottom: 15px;">Paste ingredients list below. We will try to automatically identify matching ingredients from your database.</p>
        <div class="form-group">
            <label>Recipe Name (Optional)</label>
            <input type="text" id="pasteRecipeName">
        </div>
        <div class="form-group">
            <label>Recipe Text</label>
            <textarea id="pasteRecipeText" rows="10" placeholder="Example:\n1 cup flour\n2 eggs\n..." required></textarea>
        </div>
        <div style="display:flex; gap: 10px; margin-top:20px;">
            <button class="btn primary-btn" id="parseRecipeBtn">Parse & Review</button>
            <button class="btn icon-btn" onclick="closeModal()">Cancel</button>
        </div>
    `;
    modalOverlay.classList.remove('hidden');

    document.getElementById('parseRecipeBtn').addEventListener('click', () => {
        const text = document.getElementById('pasteRecipeText').value;
        const name = document.getElementById('pasteRecipeName').value || "Pasted Recipe";
        
        if(!text) return;
        
        const lines = text.split(/\r?\n/).map(l => l.trim()).filter(l => l.length > 0);
        
        (async () => {
            let parsedIngredients = await parseIngredientStrings(lines);
            // Show recipe modal pre-filled
            showRecipeModal(name, parsedIngredients);
        })();
    });
}

// --- Profiles View ---
async function renderProfiles() {
    const profiles = await dbAPI.getAll('profiles');
    const grid = document.getElementById('profilesList');
    grid.innerHTML = '';
    profiles.forEach(p => {
        grid.innerHTML += `
            <div class="profile-card glass-panel">
                <h3>${p.name}</h3>
                <p>Daily Calorie Goal: ${p.calorieGoal} kcal</p>
                <button class="action-btn" onclick="deleteProfile('${p.id}')" style="margin-top:10px;">
                    <i class="fa-solid fa-trash"></i> Remove
                </button>
            </div>
        `;
    });
}

function showProfileModal() {
    modalContainer.innerHTML = `
        <h2>Add Profile</h2>
        <form id="profileForm">
            <div class="form-group">
                <label>Name</label>
                <input type="text" id="profName" required>
            </div>
            <div class="form-group">
                <label>Daily Calorie Goal</label>
                <input type="number" id="profCals" required>
            </div>
            <div style="display:flex; gap: 10px; margin-top:20px;">
                <button type="submit" class="btn primary-btn">Save</button>
                <button type="button" class="btn icon-btn" onclick="closeModal()">Cancel</button>
            </div>
        </form>
    `;
    modalOverlay.classList.remove('hidden');
    
    document.getElementById('profileForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        await dbAPI.add('profiles', {
            id: 'prof_' + Date.now(),
            name: document.getElementById('profName').value,
            calorieGoal: parseInt(document.getElementById('profCals').value)
        });
        closeModal();
        renderProfiles();
    });
}

async function deleteProfile(id) {
    await dbAPI.delete('profiles', id);
    renderProfiles();
}

// --- Calendar View & Generation ---
const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

function renderCalendar() {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    
    document.getElementById('currentMonthLabel').innerText = `${monthNames[month]} ${year}`;
    
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startDayOfWeek = firstDay.getDay(); // 0 (Sun) to 6 (Sat)
    
    const grid = document.getElementById('calendarGrid');
    grid.innerHTML = '';
    
    // Headers
    ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].forEach(day => {
        grid.innerHTML += `<div class="cal-day-header">${day}</div>`;
    });
    
    // Blank days
    for(let i=0; i<startDayOfWeek; i++) {
        grid.innerHTML += `<div></div>`;
    }
    
    // Days
    for(let i=1; i<=daysInMonth; i++) {
        const dateStr = `${year}-${String(month+1).padStart(2,'0')}-${String(i).padStart(2,'0')}`;
        // Find meals for this day
        const dayMeals = currentMealPlan.filter(m => m.date === dateStr);
        
        let mealsHtml = '';
        dayMeals.forEach(dm => {
            const r = currentRecipes.find(cr => cr.id === dm.recipeId);
            if(r) {
                mealsHtml += `<div class="cal-meal ${dm.mealType}" title="${r.name}">${dm.mealType[0]}: ${r.name}</div>`;
            }
        });
        
        grid.innerHTML += `
            <div class="cal-day">
                <div class="cal-date">${i}</div>
                <div style="flex:1;">${mealsHtml}</div>
            </div>
        `;
    }
}

function changeMonth(delta) {
    currentDate.setMonth(currentDate.getMonth() + delta);
    renderCalendar();
}

async function generatePlan() {
    if(currentRecipes.length === 0) {
        alert("Please add some recipes first!");
        return;
    }
    
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const lastDay = new Date(year, month + 1, 0).getDate();
    
    // Simple randomizer
    const mealTypes = ['Breakfast', 'Lunch', 'Dinner'];
    
    for(let d=1; d<=lastDay; d++) {
        const dateStr = `${year}-${String(month+1).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
        
        for(let type of mealTypes) {
            // Check if exists
            const exists = currentMealPlan.find(m => m.date === dateStr && m.mealType === type);
            if(!exists) {
                // Find potential recipes
                const validRecipes = currentRecipes.filter(r => r.categories.includes(type));
                if(validRecipes.length > 0) {
                    const picked = validRecipes[Math.floor(Math.random() * validRecipes.length)];
                    const entry = {
                        id: dateStr + '_' + type,
                        date: dateStr,
                        mealType: type,
                        recipeId: picked.id
                    };
                    await dbAPI.add('mealPlan', entry);
                    currentMealPlan.push(entry);
                }
            }
        }
    }
    
    renderCalendar();
    updateDashboard();
}

// --- Excel Export ---
function exportToExcel() {
    if(!window.XLSX) {
        alert("Excel export library not loaded yet.");
        return;
    }
    
    // We export Ingredients, Recipes, and MealPlan
    const wb = window.XLSX.utils.book_new();
    
    // Ingredients Sheet
    const wsIng = window.XLSX.utils.json_to_sheet(currentIngredients.map(i => ({
        Name: i.name, Unit: i.unit, Calories: i.calories, Cost: i.cost
    })));
    window.XLSX.utils.book_append_sheet(wb, wsIng, "Ingredients");
    
    // Recipes Sheet
    const wsRec = window.XLSX.utils.json_to_sheet(currentRecipes.map(r => ({
        Name: r.name, Servings: r.servings, Categories: r.categories.join(', ')
    })));
    window.XLSX.utils.book_append_sheet(wb, wsRec, "Recipes");
    
    // Meal Plan Sheet
    const wsPlan = window.XLSX.utils.json_to_sheet(currentMealPlan.map(m => {
        const r = currentRecipes.find(rec => rec.id === m.recipeId);
        return {
            Date: m.date,
            Meal: m.mealType,
            Recipe: r ? r.name : 'Unknown'
        };
    }));
    window.XLSX.utils.book_append_sheet(wb, wsPlan, "Meal Plan");
    
    window.XLSX.writeFile(wb, "PlanEats_Export.xlsx");
}

// --- Shopping List ---
let currentShoppingListData = [];

function generateShoppingList() {
    const startStr = document.getElementById('shopStartDate').value;
    const endStr = document.getElementById('shopEndDate').value;
    
    if(!startStr || !endStr) {
        alert("Please select both start and end dates.");
        return;
    }
    
    const meals = currentMealPlan.filter(m => m.date >= startStr && m.date <= endStr);
    
    let ingredientTotals = {};
    
    meals.forEach(m => {
        const recipe = currentRecipes.find(r => r.id === m.recipeId);
        if(recipe) {
            recipe.ingredients.forEach(ri => {
                if(!ingredientTotals[ri.ingredientId]) {
                    ingredientTotals[ri.ingredientId] = 0;
                }
                ingredientTotals[ri.ingredientId] += ri.quantity;
            });
        }
    });
    
    const tbody = document.getElementById('shoppingListBody');
    tbody.innerHTML = '';
    
    let totalCost = 0;
    currentShoppingListData = [];
    
    const keys = Object.keys(ingredientTotals);
    if(keys.length === 0) {
        tbody.innerHTML = '<tr><td colspan="3" style="text-align: center; color: var(--text-secondary);">No meals found in this range.</td></tr>';
        document.getElementById('exportShoppingListBtn').style.display = 'none';
        document.getElementById('shoppingListTotalCost').innerText = '$0.00';
        return;
    }
    
    keys.forEach(ingId => {
        const qty = ingredientTotals[ingId];
        const ing = currentIngredients.find(i => i.id === ingId);
        if(ing) {
            const cost = qty * ing.cost;
            totalCost += cost;
            
            currentShoppingListData.push({
                Ingredient: ing.name,
                Quantity: qty + ' ' + ing.unit,
                Cost: cost
            });
            
            tbody.innerHTML += `
                <tr>
                    <td>${ing.name}</td>
                    <td>${qty} ${ing.unit}</td>
                    <td>$${cost.toFixed(2)}</td>
                </tr>
            `;
        }
    });
    
    document.getElementById('shoppingListTotalCost').innerText = '$' + totalCost.toFixed(2);
    document.getElementById('exportShoppingListBtn').style.display = 'inline-flex';
}

function exportShoppingList() {
    if(!window.XLSX) {
        alert("Excel export library not loaded yet.");
        return;
    }
    const wb = window.XLSX.utils.book_new();
    const ws = window.XLSX.utils.json_to_sheet(currentShoppingListData);
    window.XLSX.utils.book_append_sheet(wb, ws, "Shopping List");
    window.XLSX.writeFile(wb, "ShoppingList_Export.xlsx");
}
// Attach globals for HTML onclicks
window.closeModal = closeModal;
window.deleteIngredient = deleteIngredient;
window.shareRecipe = shareRecipe;
window.deleteRecipe = deleteRecipe;
window.deleteProfile = deleteProfile;
window.changeMonth = changeMonth;
window.generatePlan = generatePlan;
window.exportToExcel = exportToExcel;
window.exportShoppingList = exportShoppingList;
window.showIngredientModal = showIngredientModal;
window.showProfileModal = showProfileModal;
window.showRecipeModal = showRecipeModal;
window.showPasteRecipeModal = showPasteRecipeModal;
window.showImportUrlModal = showImportUrlModal;
window.showImportImageModal = showImportImageModal;
window.editRecipe = editRecipe;
window.manualCleanup = manualCleanup;
window.removeIngFromRecipe = (idx) => { /* already attached in showRecipeModal */ };
