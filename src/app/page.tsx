export default function HomePage() {
  return (
    <div className="min-h-screen bg-white">
      <h1 className="text-4xl font-bold text-center pt-20">AnyLingo™</h1>
      <p className="text-center text-gray-600 mt-4">Revolutionary Language Learning</p>
      <div className="text-center mt-8">
        <a href="/payment" className="bg-blue-600 text-white px-6 py-3 rounded-lg">
          Go to Payment
        </a>
      </div>
    </div>
  )
}
