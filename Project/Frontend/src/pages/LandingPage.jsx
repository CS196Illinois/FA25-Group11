// eslint-disable-next-line no-unused-vars
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import './LandingPage.css';

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      duration: 0.6,
      staggerChildren: 0.1,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.6,
      ease: [0.6, -0.05, 0.01, 0.99],
    },
  },
};

const floatingVariants = {
  animate: {
    y: [0, -20, 0],
    transition: {
      duration: 4,
      repeat: Infinity,
      ease: "easeInOut",
    },
  },
};

function LandingPage() {
  const navigate = useNavigate();
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const handleMouseMove = (e) => {
      setMousePosition({
        x: (e.clientX / window.innerWidth - 0.5) * 20,
        y: (e.clientY / window.innerHeight - 0.5) * 20,
      });
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  return (
    <motion.div
      className="landing-page"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      exit={{ opacity: 0, transition: { duration: 0.3 } }}
    >
      {/* Animated background gradient */}
      <div className="gradient-background" />
      
      {/* Floating orbs */}
      <motion.div
        className="floating-orb orb-1"
        variants={floatingVariants}
        animate="animate"
        style={{
          x: mousePosition.x * 0.5,
          y: mousePosition.y * 0.5,
        }}
      />
      <motion.div
        className="floating-orb orb-2"
        variants={floatingVariants}
        animate="animate"
        style={{
          x: mousePosition.x * -0.3,
          y: mousePosition.y * -0.3,
        }}
      />

      {/* Navigation */}
      <motion.nav
        className="nav"
        variants={itemVariants}
      >
        <div className="nav-content">
          <motion.div
            className="logo"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <span className="logo-text">Illinois</span>
            <span className="logo-accent">Course</span>
          </motion.div>
          <div className="nav-links">
            <motion.a
              href="#features"
              whileHover={{ y: -2 }}
              className="nav-link"
            >
              Features
            </motion.a>
            <motion.a
              href="#about"
              whileHover={{ y: -2 }}
              className="nav-link"
            >
              About
            </motion.a>
            <motion.button
              className="nav-button"
              onClick={() => navigate('/onboarding')}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              Get Started
            </motion.button>
          </div>
        </div>
      </motion.nav>

      {/* Hero Section */}
      <section className="hero">
        <motion.div
          className="hero-content"
          variants={containerVariants}
        >
          <motion.h1
            className="hero-title"
            variants={itemVariants}
          >
            Plan Your Academic Journey
            <span className="gradient-text"> with Confidence</span>
          </motion.h1>
          
          <motion.p
            className="hero-subtitle"
            variants={itemVariants}
          >
            Personalized course recommendations powered by AI, designed specifically for 
            University of Illinois students. Discover the perfect path to your degree.
          </motion.p>

          <motion.div
            className="hero-actions"
            variants={itemVariants}
          >
            <motion.button
              className="btn btn-primary"
              onClick={() => navigate('/onboarding')}
              whileHover={{ scale: 1.05, boxShadow: '0 20px 40px rgba(255, 107, 53, 0.3)' }}
              whileTap={{ scale: 0.95 }}
            >
              Start Planning
              <motion.span
                className="btn-arrow"
                animate={{ x: [0, 5, 0] }}
                transition={{ duration: 1.5, repeat: Infinity }}
              >
                →
              </motion.span>
            </motion.button>
            
            <motion.button
              className="btn btn-secondary"
              onClick={() => {
                document.getElementById('features').scrollIntoView({ behavior: 'smooth' });
              }}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              Learn More
            </motion.button>
          </motion.div>

          {/* Stats */}
          <motion.div
            className="hero-stats"
            variants={itemVariants}
          >
            <div className="stat-item">
              <motion.div
                className="stat-number"
                initial={{ opacity: 0, scale: 0.5 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.8, duration: 0.5 }}
              >
                7,968
              </motion.div>
              <div className="stat-label">Courses Available</div>
            </div>
            <div className="stat-item">
              <motion.div
                className="stat-number"
                initial={{ opacity: 0, scale: 0.5 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 1, duration: 0.5 }}
              >
                317
              </motion.div>
              <div className="stat-label">Majors Supported</div>
            </div>
            <div className="stat-item">
              <motion.div
                className="stat-number"
                initial={{ opacity: 0, scale: 0.5 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 1.2, duration: 0.5 }}
              >
                AI-Powered
              </motion.div>
              <div className="stat-label">Recommendations</div>
            </div>
          </motion.div>
        </motion.div>

        {/* Hero Visual */}
        <motion.div
          className="hero-visual"
          variants={itemVariants}
        >
          <motion.div
            className="visual-card"
            whileHover={{ y: -10, rotate: 2 }}
            transition={{ type: "spring", stiffness: 300 }}
          >
            <div className="card-content">
              <div className="card-header">
                <div className="card-dots">
                  <span></span>
                  <span></span>
                  <span></span>
                </div>
              </div>
              <div className="card-body">
                <div className="course-item">
                  <div className="course-code">CS 124</div>
                  <div className="course-name">Introduction to Computer Science</div>
                </div>
                <div className="course-item">
                  <div className="course-code">MATH 220</div>
                  <div className="course-name">Calculus</div>
                </div>
                <div className="course-item recommended">
                  <div className="course-code">CS 225</div>
                  <div className="course-name">Data Structures</div>
                  <div className="recommended-badge">Recommended</div>
                </div>
              </div>
            </div>
          </motion.div>
        </motion.div>
      </section>

      {/* Features Section */}
      <section id="features" className="features">
        <motion.div
          className="features-container"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.6 }}
        >
          <motion.h2
            className="section-title"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            Why Choose Our Platform?
          </motion.h2>

          <div className="features-grid">
            {[
              {
                icon: '🎯',
                title: 'Personalized Recommendations',
                description: 'AI-powered suggestions based on your completed courses and major requirements.',
              },
              {
                icon: '📊',
                title: 'Prerequisite Tracking',
                description: 'Never miss a prerequisite. Our system tracks all course requirements automatically.',
              },
              {
                icon: '🎓',
                title: 'Major Alignment',
                description: 'Get recommendations that align perfectly with your degree requirements.',
              },
              {
                icon: '⚡',
                title: 'Fast & Accurate',
                description: 'Get instant recommendations powered by our advanced recommendation engine.',
              },
            ].map((feature, index) => (
              <motion.div
                key={index}
                className="feature-card"
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-50px" }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                whileHover={{ y: -10, scale: 1.02 }}
              >
                <div className="feature-icon">{feature.icon}</div>
                <h3 className="feature-title">{feature.title}</h3>
                <p className="feature-description">{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </section>

      {/* CTA Section */}
      <section className="cta-section">
        <motion.div
          className="cta-content"
          initial={{ opacity: 0, scale: 0.9 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <h2 className="cta-title">Ready to Plan Your Future?</h2>
          <p className="cta-subtitle">
            Join thousands of Illinois students who are already using our platform
          </p>
          <motion.button
            className="btn btn-primary btn-large"
            onClick={() => navigate('/onboarding')}
            whileHover={{ scale: 1.05, boxShadow: '0 20px 40px rgba(255, 107, 53, 0.4)' }}
            whileTap={{ scale: 0.95 }}
          >
            Get Started Now
          </motion.button>
        </motion.div>
      </section>

      {/* Footer */}
      <footer className="footer">
        <div className="footer-content">
          <p>&copy; 2025 University of Illinois Course Recommender. Built for Illinois students.</p>
        </div>
      </footer>
    </motion.div>
  );
}

export default LandingPage;

