
import Navbar from './components/Navbar';
import Hero from './components/Hero';
import Features from './components/Features';
import Ecosystem from './components/Ecosystem';
import Guarantees from './components/Guarantees';
import Footer from './components/Footer';

function App() {
  return (
    <div className="min-h-screen bg-white">
      <Navbar />
      <main>
        <Hero />
        <Features />
        <Ecosystem />
        <Guarantees />
      </main>
      <Footer />
    </div>
  )
}

export default App;
