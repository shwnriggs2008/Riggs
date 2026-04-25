const firebaseConfig = {
  apiKey: "AIzaSyBDVHoPzrsEhyd1vT5gZ3ziNixcKOwijE0",
  authDomain: "recipes-20b72.firebaseapp.com",
  projectId: "recipes-20b72",
  storageBucket: "recipes-20b72.firebasestorage.app",
  messagingSenderId: "942660757472",
  appId: "1:942660757472:web:b62baca0cf2b5b270f2d85",
  measurementId: "G-J5CZTXW56Z"
};

// Initialize Firebase
const app = firebase.initializeApp(firebaseConfig);
const db = firebase.app().firestore('recipes');
const auth = firebase.auth();

const googleProvider = new firebase.auth.GoogleAuthProvider();

// Scoped Collection Helper
const getCollection = (collectionName) => {
    const user = auth.currentUser;
    if (user) {
        return db.collection('users').doc(user.uid).collection(collectionName);
    }
    return db.collection(collectionName); // Fallback to global if not logged in (or handle differently)
};

// API for app.js (Drop-in replacement for old IndexedDB methods)
const dbAPI = {
    async login() {
        try {
            const result = await auth.signInWithPopup(googleProvider);
            return result.user;
        } catch (e) {
            console.error("Login failed", e);
            throw e;
        }
    },

    async logout() {
        await auth.signOut();
    },

    onAuth(callback) {
        auth.onAuthStateChanged(callback);
    },

    async getAll(collectionName) {
        try {
            const snapshot = await getCollection(collectionName).get();
            return snapshot.docs.map(doc => {
                let data = doc.data();
                if(!data.id) data.id = doc.id;
                return data;
            });
        } catch (e) {
            console.error("Error getting documents: ", e);
            return [];
        }
    },

    async add(collectionName, data) {
        try {
            const col = getCollection(collectionName);
            if (data.id) {
                await col.doc(data.id).set(data);
                return data.id;
            } else {
                const docRef = await col.add(data);
                return docRef.id;
            }
        } catch (e) {
            console.error("Error adding document: ", e);
            throw e;
        }
    },

    async delete(collectionName, id) {
        try {
            await getCollection(collectionName).doc(id).delete();
        } catch (e) {
            console.error("Error deleting document: ", e);
            throw e;
        }
    },
    
    async clear(collectionName) {
        try {
            const snapshot = await getCollection(collectionName).get();
            const batch = db.batch();
            snapshot.docs.forEach((doc) => {
                batch.delete(doc.ref);
            });
            await batch.commit();
        } catch (e) {
            console.error("Error clearing collection: ", e);
            throw e;
        }
    }
};

