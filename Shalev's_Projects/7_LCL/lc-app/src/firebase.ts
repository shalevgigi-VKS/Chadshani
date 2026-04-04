import { initializeApp } from 'firebase/app'
import { getAuth } from 'firebase/auth'
import { getFirestore } from 'firebase/firestore'

const firebaseConfig = {
  apiKey: 'AIzaSyA3e_lKANZPgKgCn2LLusVVQclFJoto6j4',
  authDomain: 'lcl-4b863.firebaseapp.com',
  projectId: 'lcl-4b863',
  storageBucket: 'lcl-4b863.firebasestorage.app',
  messagingSenderId: '611443009479',
  appId: '1:611443009479:web:06c2c7bd1769ed429f9be2',
}

const app = initializeApp(firebaseConfig)

export const auth = getAuth(app)
export const db = getFirestore(app)
export default app
