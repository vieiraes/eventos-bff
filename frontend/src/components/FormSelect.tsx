import { SelectHTMLAttributes } from 'react'

interface FormSelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label: string
  error?: string
  helperText?: string
  children: React.ReactNode
}

export function FormSelect({ 
  label, 
  error, 
  helperText, 
  id, 
  className = '', 
  children,
  ...props 
}: FormSelectProps) {
  const selectId = id || label.toLowerCase().replace(/\s+/g, '-')

  return (
    <div>
      <label 
        htmlFor={selectId} 
        className="block text-base font-semibold text-gray-700 mb-2"
      >
        {label}
      </label>
      <select
        id={selectId}
        className={`
          mt-1 block w-full rounded-lg border-2 bg-gray-50
          px-4 py-3 text-base
          transition-colors duration-200
          hover:border-gray-500 hover:bg-white
          focus:border-indigo-600 focus:ring-2 focus:ring-indigo-500 focus:bg-white focus:outline-none
          disabled:bg-gray-100 disabled:cursor-not-allowed
          ${error ? 'border-red-400 focus:border-red-600 focus:ring-red-500' : 'border-gray-400'}
          ${className}
        `}
        {...props}
      >
        {children}
      </select>
      {helperText && !error && (
        <p className="mt-2 text-sm text-gray-500">{helperText}</p>
      )}
      {error && (
        <p className="mt-2 text-sm text-red-600">{error}</p>
      )}
    </div>
  )
}
