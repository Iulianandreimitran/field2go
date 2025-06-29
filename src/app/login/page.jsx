// src/app/login/page.jsx
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { signIn } from 'next-auth/react'
import Link from 'next/link'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [message, setMessage] = useState('')
  const [showPwd, setShowPwd] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setMessage('')

    const res = await signIn('credentials', {
      redirect: false,
      email,
      password,
    })

    if (res?.error) {
      setMessage('Eroare: ' + res.error)
    } else {
      router.push('/') 
    }
  }


  function handleGoogleSignIn() {
    signIn('google', { callbackUrl: '/' }) 
  }

   return (
    <div className="min-h-screen flex items-center justify-center bg-gray-900">
      <div className="flex shadow-xl rounded-2xl overflow-hidden max-w-4xl w-full">
        {/* LEFT: FORMULAR */}
        <div className="w-full md:w-1/2 bg-gray-800 p-8 flex flex-col justify-center">
          <h1 className="text-3xl font-bold text-white text-center mb-6">Autentificare</h1>
          {message && <p className="mb-4 text-red-400 text-center">{message}</p>}

          <form onSubmit={handleSubmit} className="space-y-4 mb-6">
            <div>
              <label className="block text-white mb-1">Email</label>
              <input
                type="email"
                value={email}
                required
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-2 bg-gray-700 text-white placeholder-gray-400 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500"
                placeholder="you@example.com"
              />
            </div>

            <div className="relative">
              <label className="block text-white mb-1">Parolă</label>
              <input
                type={showPwd ? 'text' : 'password'}
                value={password}
                required
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-2 bg-gray-700 text-white placeholder-gray-400 rounded-lg pr-10 focus:outline-none focus:ring-2 focus:ring-pink-500"
                placeholder="Parola"
              />
              <button
                type="button"
                onClick={() => setShowPwd((v) => !v)}
                className="absolute top-9 right-3 text-gray-400 text-sm"
                tabIndex={-1}
              >
                {showPwd ? '🙈' : '👁️'}
              </button>
            </div>

            <button
              type="submit"
              className="w-full py-2 bg-gradient-to-r from-green-400 to-green-600 text-white font-semibold rounded-lg shadow hover:shadow-md hover:brightness-110 transition duration-200"
            >
              Log in
            </button>
          </form>

          <button
            onClick={handleGoogleSignIn}
            className="w-full py-2 bg-gradient-to-r from-blue-500 to-blue-700 text-white font-medium rounded-lg shadow hover:shadow-md transition duration-200 mb-4"
          >
            Autentificare cu Google
          </button>


          <p className="text-center text-white text-sm">
            Nu ai cont?{' '}
            <Link href="/register" className="text-blue-400 hover:underline">
              Înregistrează-te
            </Link>
          </p>
        </div>

        {/* RIGHT: Mesaj + vibe */}
        <div className="hidden md:flex w-1/2 bg-gradient-to-br from-pink-600 via-purple-600 to-indigo-600 text-white flex-col items-center justify-center p-8">
          <h2 className="text-4xl font-bold mb-4">Bine ai venit!</h2>
          <p className="text-lg text-center leading-relaxed">
            Alătură-te comunității Field2Go și rezervă terenuri mai ușor ca niciodată.
          </p>
        </div>
      </div>
    </div>
  )
}