import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { FaPaw, FaStethoscope, FaCalendarCheck, FaClipboardList, FaShoppingCart, FaArrowRight, FaChevronLeft, FaChevronRight } from "react-icons/fa";
import { productBaseURL } from "../axiosinstance";
import { useNavigate } from "react-router-dom";


function Home() {
  const navigate = useNavigate();
  const [featuredProducts, setFeaturedProducts] = useState([]);
  const [productsLoading, setProductsLoading] = useState(true);
  const [currentSlide, setCurrentSlide] = useState(0);
  const productsPerSlide = 5; // Show 5 products at a time

  // Fetch products from the database
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setProductsLoading(true);
        const { data } = await productBaseURL.get("/");
        if (data?.success) {
          setFeaturedProducts(data.data);
        }
      } catch (error) {
        console.error("Error fetching products:", error);
      } finally {
        setProductsLoading(false);
      }
    };

    fetchProducts();
  }, []);

  // Calculate total slides
  const totalSlides = Math.ceil(featuredProducts.length / productsPerSlide);

  // Navigation functions
  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % totalSlides);
  };

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + totalSlides) % totalSlides);
  };

  // Get current products to display
  const getCurrentProducts = () => {
    const startIndex = currentSlide * productsPerSlide;
    return featuredProducts.slice(startIndex, startIndex + productsPerSlide);
  };

  const features = [
    {
      icon: <FaPaw size={40} className="text-yellow-500" />,
      title: "Pet Profiles",
      description: "Manage detailed medical records for all pets.",
    },
    {
      icon: <FaStethoscope size={40} className="text-yellow-500" />,
      title: "Medical Records",
      description: "Track vaccinations, treatments, and consultations.",
    },
    {
      icon: <FaCalendarCheck size={40} className="text-yellow-500" />,
      title: "Appointments",
      description: "Schedule and monitor veterinary appointments easily.",
    },
    {
      icon: <FaClipboardList size={40} className="text-yellow-500" />,
      title: "Reports",
      description: "Generate detailed reports on pets, medical records, and payments.",
    },
  ];

  return (
    <div className="min-h-screen bg-yellow-50">

      <section className="relative bg-gradient-to-r from-yellow-100 to-yellow-300 py-24">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between">
          <motion.div
            initial={{ x: -100, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ duration: 1 }}
            className="md:w-1/2 mb-12 md:mb-0"
          >
            <h1 className="text-5xl font-bold text-yellow-900 mb-6">
              Welcome to PetIQ.LK Veterinary System!
            </h1>
            <p className="text-lg text-yellow-800 mb-6">
              Complete management for pets, appointments, medical records, and pet products – all in one place.
            </p>
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
              className="bg-yellow-500 hover:bg-yellow-600 text-white font-bold py-3 px-6 rounded-xl shadow-lg"
            >
              Get Started
            </motion.button>
          </motion.div>

          <motion.div
            initial={{ x: 100, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ duration: 1 }}
            className="md:w-1/2"
          >
            <img
            src="src/assets/pethome.jpg"
            alt="Pets"
            className="rounded-3xl shadow-2xl object-cover w-full h-96"
            />
          </motion.div>
        </div>
      </section>

     
      <section className="py-24">
        <div className="max-w-7xl mx-auto px-6">
          <h2 className="text-4xl font-bold text-center text-yellow-900 mb-12">Features</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => (
              <motion.div
                key={index}
                whileHover={{ scale: 1.05 }}
                className="bg-white p-8 rounded-3xl shadow-xl text-center hover:shadow-2xl transition-shadow"
              >
                <div className="mb-4 flex justify-center">{feature.icon}</div>
                <h3 className="text-xl font-semibold text-yellow-900 mb-2">{feature.title}</h3>
                <p className="text-yellow-800">{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Products Carousel Section */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-8">
            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="text-3xl font-bold text-yellow-900 mb-3"
            >
              Featured Pet Products
            </motion.h2>
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="text-yellow-800 text-base max-w-xl mx-auto"
            >
              Discover our carefully curated selection of high-quality pet products
            </motion.p>
          </div>

          {productsLoading ? (
            <div className="flex justify-center items-center py-16">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-yellow-500"></div>
            </div>
          ) : featuredProducts.length > 0 ? (
            <div className="relative">
              {/* Carousel Container */}
              <div className="overflow-hidden rounded-xl">
                <motion.div
                  className="flex transition-transform duration-500 ease-in-out"
                  style={{ transform: `translateX(-${currentSlide * 100}%)` }}
                >
                  {Array.from({ length: totalSlides }).map((_, slideIndex) => (
                    <div key={slideIndex} className="w-full flex-shrink-0">
                      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-6">
                        {featuredProducts
                          .slice(slideIndex * productsPerSlide, (slideIndex + 1) * productsPerSlide)
                          .map((product, productIndex) => (
                            <motion.div
                              key={product._id}
                              initial={{ opacity: 0, scale: 0.9 }}
                              animate={{ opacity: 1, scale: 1 }}
                              transition={{ duration: 0.5, delay: productIndex * 0.1 }}
                              className="bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-xl transition-all duration-300 border border-gray-100 group h-[350px] flex flex-col cursor-pointer"
                              onClick={() => navigate(`/product/${product._id}`)}
                            >
                              <div className="relative overflow-hidden h-40 p-3">
                                <img
                                  src={product.image}
                                  alt={product.name}
                                  className="w-full h-full object-cover rounded-lg transition-transform duration-300 group-hover:scale-105"
                                  onError={(e) => {
                                    e.target.src = 'https://via.placeholder.com/300x200/FEF3C7/D97706?text=Pet+Product';
                                  }}
                                />
                                <div className="absolute top-4 right-4 bg-gradient-to-r from-yellow-500 to-orange-500 text-white px-3 py-2 rounded-lg text-sm font-bold shadow-lg border-2 border-white">
                                  Rs. {product.price.toLocaleString()}
                                </div>
                                {product.stock <= 5 && product.stock > 0 && (
                                  <div className="absolute top-5 left-5 bg-red-500 text-white px-2 py-1 rounded-md text-xs font-bold">
                                    Low!
                                  </div>
                                )}
                              </div>
                              
                              <div className="p-4 flex flex-col flex-grow">
                                <h3 className="text-base font-bold text-gray-900 mb-3 group-hover:text-yellow-700 transition-colors leading-tight">
                                  {product.name}
                                </h3>
                                
                                <div className="space-y-3 mt-auto">
                                  <div className="flex items-center justify-between">
                                    <span className={`inline-flex items-center px-2 py-1 rounded-md text-xs font-medium ${
                                      product.stock > 10 
                                        ? 'bg-green-100 text-green-800' 
                                        : product.stock > 0 
                                        ? 'bg-yellow-100 text-yellow-800' 
                                        : 'bg-red-100 text-red-800'
                                    }`}>
                                      {product.stock > 0 ? `${product.stock} left` : 'Out'}
                                    </span>
                                    
                                    {product.category && (
                                      <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-md truncate max-w-16">
                                        {product.category}
                                      </span>
                                    )}
                                  </div>
                                  
                                  <motion.button
                                    whileHover={{ scale: 1.02 }}
                                    whileTap={{ scale: 0.98 }}
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      // Add cart logic here
                                    }}
                                    className="w-full bg-gradient-to-r from-yellow-500 to-yellow-600 hover:from-yellow-600 hover:to-yellow-700 text-white px-3 py-2 rounded-lg font-medium transition-all duration-200 flex items-center justify-center gap-2 shadow-sm text-sm"
                                  >
                                    <FaShoppingCart size={12} />
                                    Add to Cart
                                  </motion.button>
                                </div>
                              </div>
                            </motion.div>
                        ))}
                      </div>
                    </div>
                  ))}
                </motion.div>
              </div>

              {/* Navigation Buttons */}
              {totalSlides > 1 && (
                <>
                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={prevSlide}
                    className="absolute left-[-60px] top-[200px] -translate-y-1/2 bg-white hover:bg-yellow-50 text-gray-600 hover:text-yellow-600 p-4 rounded-full shadow-lg border border-gray-200 hover:border-yellow-300 z-10 transition-all duration-200"
                  >
                    <FaChevronLeft size={20} />
                  </motion.button>
                  
                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={nextSlide}
                    className="absolute right-[-60px] top-[200px] -translate-y-1/2 bg-white hover:bg-yellow-50 text-gray-600 hover:text-yellow-600 p-4 rounded-full shadow-lg border border-gray-200 hover:border-yellow-300 z-10 transition-all duration-200"
                  >
                    <FaChevronRight size={20} />
                  </motion.button>
                </>
              )}

              {/* Slide Indicators */}
              {totalSlides > 1 && (
                <div className="flex justify-center mt-6 gap-2">
                  {Array.from({ length: totalSlides }).map((_, index) => (
                    <motion.button
                      key={index}
                      whileHover={{ scale: 1.2 }}
                      onClick={() => setCurrentSlide(index)}
                      className={`w-2 h-2 rounded-full transition-all duration-200 ${
                        currentSlide === index
                          ? 'bg-yellow-500 shadow-md'
                          : 'bg-gray-300 hover:bg-gray-400'
                      }`}
                    />
                  ))}
                </div>
              )}

              {/* View All Products Button */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.3 }}
                className="text-center mt-8"
              >
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => navigate("/products")}
                  className="bg-gradient-to-r from-yellow-500 to-yellow-600 hover:from-yellow-600 hover:to-yellow-700 text-white font-semibold py-3 px-6 rounded-xl shadow-md transition-all duration-300 flex items-center gap-2 mx-auto"
                >
                  View All Products
                  <FaArrowRight size={14} />
                </motion.button>
              </motion.div>
            </div>
          ) : (
            <motion.div
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              className="text-center py-16"
            >
              <FaShoppingCart className="text-6xl text-gray-300 mb-4 mx-auto" />
              <h3 className="text-2xl font-semibold text-gray-600 mb-2">No Products Available</h3>
              <p className="text-gray-500">Products will appear here once the admin adds them!</p>
            </motion.div>
          )}
        </div>
      </section>

      <section className="py-24 bg-yellow-100 relative overflow-hidden">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 1 }}
          className="max-w-3xl mx-auto text-center"
        >
          <h2 className="text-4xl font-bold text-yellow-900 mb-6">Manage Your Pets Efficiently</h2>
          <p className="text-yellow-800 mb-6">
            From medical records to appointments and payments, PetCare keeps everything in one place.
          </p>
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
            className="bg-yellow-500 hover:bg-yellow-600 text-white font-bold py-3 px-6 rounded-xl shadow-lg"
          >
            Explore Dashboard
          </motion.button>
        </motion.div>

  
        <motion.div
          animate={{ y: [0, 20, 0] }}
          transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
          className="absolute top-10 left-10 text-yellow-400 text-5xl"
        >
          🐾
        </motion.div>
        <motion.div
          animate={{ y: [0, -20, 0] }}
          transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
          className="absolute bottom-10 right-10 text-yellow-400 text-6xl"
        >
          🐾
        </motion.div>
      </section>
    </div>
  );
}

export default Home;
