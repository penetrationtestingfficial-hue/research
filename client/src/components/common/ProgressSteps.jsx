export default function ProgressSteps({ currentStep, steps }) {
  return (
    <div className="flex items-center justify-between mb-8">
      {steps.map((step, index) => (
        <div key={index} className="flex items-center flex-1">
          <div className="flex flex-col items-center flex-1">
            <div className={`
              w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold
              transition-all duration-300
              ${index < currentStep
                ? 'bg-green-500 text-white'
                : index === currentStep
                ? 'bg-blue-500 text-white'
                : 'bg-gray-200 text-gray-500'
              }
            `}>
              {index < currentStep ? '✓' : index + 1}
            </div>
            <p className={`
              text-xs mt-2 font-medium
              ${index <= currentStep ? 'text-gray-700' : 'text-gray-400'}
            `}>
              {step}
            </p>
          </div>
          {index < steps.length - 1 && (
            <div className={`
              flex-1 h-1 mx-2 rounded transition-all duration-300
              ${index < currentStep ? 'bg-green-500' : 'bg-gray-200'}
            `} />
          )}
        </div>
      ))}
    </div>
  );
}