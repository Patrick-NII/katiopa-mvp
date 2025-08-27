'use client'
import { useState, InputHTMLAttributes } from 'react'
export default function PasswordInput(props: InputHTMLAttributes<HTMLInputElement>) {
  const [show, setShow] = useState(false)
  return (
    <div className="relative">
      <input {...props} type={show ? 'text' : 'password'} className="input pr-12" />
      <button type="button" onClick={() => setShow(!show)} className="absolute inset-y-0 right-2 my-auto text-sm text-gray-500">
        {show ? 'Masquer' : 'Afficher'}
      </button>
    </div>
  )
}
