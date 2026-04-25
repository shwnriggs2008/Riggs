import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getFirestore, collection, doc, getDocs, getDoc, setDoc, addDoc, deleteDoc, writeBatch, query, where } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";
import { getAuth, signInWithPopup, GoogleAuthProvider, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

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
const app = initializeApp(firebaseConfig);
const db = getFirestore(app, "recipes");
const auth = getAuth(app);
const googleProvider = new GoogleAuthProvider();

// Scoped Collection Helper
const getCollectionRef = (collectionName) => {
    const user = auth.currentUser;
    if (user) {
        return collection(db, 'users', user.uid, collectionName);
    }
    return collection(db, collectionName);
};

// API for app.js
window.dbAPI = {
    async login() {
        try {
            const result = await signInWithPopup(auth, googleProvider);
            return result.user;
        } catch (e) {
            console.error("Login failed", e);
            throw e;
        }
    },

    async logout() {
        await signOut(auth);
    },

    onAuth(callback) {
        onAuthStateChanged(auth, callback);
    },

    async getOne(collectionName, id) {
        try {
            const colRef = getCollectionRef(collectionName);
            const d = await getDoc(doc(colRef, id));
            if (d.exists()) {
                let data = d.data();
                data.id = d.id;
                return data;
            }
            return null;
        } catch (e) {
            console.error("Error getting document: ", e);
            throw e;
        }
    },

    async getAll(collectionName) {
        try {
            const q = query(getCollectionRef(collectionName));
            const snapshot = await getDocs(q);
            return snapshot.docs.map(d => {
                let data = d.data();
                if(!data.id) data.id = d.id;
                return data;
            });
        } catch (e) {
            console.error("Error getting documents: ", e);
            throw e;
        }
    },

    async add(collectionName, data) {
        try {
            const colRef = getCollectionRef(collectionName);
            if (data.id) {
                await setDoc(doc(colRef, data.id), data);
                return data.id;
            } else {
                const docRef = await addDoc(colRef, data);
                return docRef.id;
            }
        } catch (e) {
            console.error("Error adding document: ", e);
            throw e;
        }
    },

    async delete(collectionName, id) {
        try {
            const colRef = getCollectionRef(collectionName);
            await deleteDoc(doc(colRef, id));
        } catch (e) {
            console.error("Error deleting document: ", e);
            throw e;
        }
    },
    
    async clear(collectionName) {
        try {
            const colRef = getCollectionRef(collectionName);
            const snapshot = await getDocs(colRef);
            const batch = writeBatch(db);
            snapshot.docs.forEach((d) => {
                batch.delete(d.ref);
            });
            await batch.commit();
        } catch (e) {
            console.error("Error clearing collection: ", e);
            throw e;
        }
    }
};

// Export db for raw access if needed (though app.js uses dbAPI)
window.db = db;
