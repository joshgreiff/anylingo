// AnyLingo Landing Page JavaScript

document.addEventListener('DOMContentLoaded', function() {
    // Smooth scrolling for navigation links
    const navLinks = document.querySelectorAll('a[href^="#"]');
    navLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            const targetId = this.getAttribute('href');
            const targetSection = document.querySelector(targetId);
            
            if (targetSection) {
                targetSection.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        });
    });

    // Intersection Observer for animations
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };

    const observer = new IntersectionObserver(function(entries) {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('animate-in');
            }
        });
    }, observerOptions);

    // Observe elements for animation
    const animateElements = document.querySelectorAll('.feature-card, .stat-number, .pricing-card');
    animateElements.forEach(el => {
        observer.observe(el);
    });

    // Navigation scroll effect
    const nav = document.querySelector('nav');
    let lastScrollY = window.scrollY;

    window.addEventListener('scroll', function() {
        const currentScrollY = window.scrollY;
        
        if (currentScrollY > 100) {
            nav.classList.add('bg-white/95', 'backdrop-blur-sm');
        } else {
            nav.classList.remove('bg-white/95', 'backdrop-blur-sm');
        }
        
        lastScrollY = currentScrollY;
    });

    // Demo video modal
    const demoButtons = document.querySelectorAll('a[href="#demo"]');
    demoButtons.forEach(button => {
        button.addEventListener('click', function(e) {
            e.preventDefault();
            showDemoModal();
        });
    });

    // Signup form handling
    const signupButtons = document.querySelectorAll('a[href="#signup"]');
    signupButtons.forEach(button => {
        button.addEventListener('click', function(e) {
            e.preventDefault();
            showSignupModal();
        });
    });

    // Stats counter animation
    function animateCounters() {
        const counters = document.querySelectorAll('.stat-number');
        counters.forEach(counter => {
            const target = parseInt(counter.getAttribute('data-target'));
            const duration = 2000; // 2 seconds
            const increment = target / (duration / 16); // 60fps
            let current = 0;

            const timer = setInterval(() => {
                current += increment;
                if (current >= target) {
                    current = target;
                    clearInterval(timer);
                }
                counter.textContent = Math.floor(current);
            }, 16);
        });
    }

    // Initialize counters when they come into view
    const statsSection = document.querySelector('#benefits');
    if (statsSection) {
        const statsObserver = new IntersectionObserver(function(entries) {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    animateCounters();
                    statsObserver.unobserve(entry.target);
                }
            });
        }, { threshold: 0.5 });

        statsObserver.observe(statsSection);
    }

    // Mobile menu toggle
    const mobileMenuButton = document.querySelector('.mobile-menu-button');
    const mobileMenu = document.querySelector('.mobile-menu');
    
    if (mobileMenuButton && mobileMenu) {
        mobileMenuButton.addEventListener('click', function() {
            mobileMenu.classList.toggle('hidden');
        });
    }

    // Form validation
    function validateEmail(email) {
        const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return re.test(email);
    }

    // Contact form handling
    const contactForm = document.querySelector('#contact-form');
    if (contactForm) {
        contactForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            const formData = new FormData(this);
            const email = formData.get('email');
            const name = formData.get('name');
            const message = formData.get('message');

            if (!validateEmail(email)) {
                showNotification('Please enter a valid email address', 'error');
                return;
            }

            if (!name || !message) {
                showNotification('Please fill in all fields', 'error');
                return;
            }

            // Simulate form submission
            showNotification('Thank you! We\'ll get back to you soon.', 'success');
            this.reset();
        });
    }

    // Notification system
    function showNotification(message, type = 'info') {
        const notification = document.createElement('div');
        notification.className = `fixed top-4 right-4 p-4 rounded-lg shadow-lg z-50 ${
            type === 'success' ? 'bg-green-500 text-white' :
            type === 'error' ? 'bg-red-500 text-white' :
            'bg-blue-500 text-white'
        }`;
        notification.textContent = message;

        document.body.appendChild(notification);

        setTimeout(() => {
            notification.remove();
        }, 5000);
    }

    // Demo modal
    function showDemoModal() {
        const modal = document.createElement('div');
        modal.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50';
        modal.innerHTML = `
            <div class="bg-white rounded-lg p-8 max-w-6xl mx-4" style="max-height: 90vh;">
                <div class="flex justify-between items-center mb-4">
                    <h3 class="text-2xl font-bold">AnyLingo Demo - Revolutionary Language Learning</h3>
                    <button class="text-gray-500 hover:text-gray-700 text-2xl" onclick="this.closest('.fixed').remove()">&times;</button>
                </div>
                <div class="aspect-video rounded-lg overflow-hidden" style="min-height: 500px;">
                    <iframe 
                        src="https://www.youtube.com/embed/1p-2AATF4sA?si=mLsiZBK1Xq_c4TUQ" 
                        title="AnyLingo - Revolutionary Language Learning Demo"
                        frameborder="0" 
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" 
                        allowfullscreen
                        class="w-full h-full">
                    </iframe>
                </div>
                <div class="mt-4 text-center">
                    <p class="text-gray-600 mb-4">
                        Discover how AnyLingo revolutionizes language learning through AI-driven subconscious training and guided self-learning.
                    </p>
                    <a href="#signup" class="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors">
                        Start Free Trial
                    </a>
                </div>
            </div>
        `;

        document.body.appendChild(modal);
        modal.addEventListener('click', function(e) {
            if (e.target === modal) {
                modal.remove();
            }
        });
    }

    // Signup modal
    function showSignupModal() {
        const modal = document.createElement('div');
        modal.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50';
        modal.innerHTML = `
            <div class="bg-white rounded-lg p-8 max-w-md mx-4">
                <div class="flex justify-between items-center mb-4">
                    <h3 class="text-2xl font-bold">Start Your Free Trial</h3>
                    <button class="text-gray-500 hover:text-gray-700 text-2xl" onclick="this.closest('.fixed').remove()">&times;</button>
                </div>
                <form id="signup-form" class="space-y-4">
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                        <input type="text" name="name" required class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
                    </div>
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1">Email</label>
                        <input type="email" name="email" required class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
                    </div>
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1">Password</label>
                        <input type="password" name="password" required class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
                    </div>
                    <button type="submit" class="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition-colors">
                        Start Free Trial
                    </button>
                </form>
                <p class="text-sm text-gray-500 mt-4 text-center">
                    No credit card required for the 7-day free trial
                </p>
            </div>
        `;

        document.body.appendChild(modal);
        
        // Handle form submission
        const form = modal.querySelector('#signup-form');
        form.addEventListener('submit', function(e) {
            e.preventDefault();
            showNotification('Account created! Redirecting to AnyLingo...', 'success');
            setTimeout(() => {
                window.location.href = 'app/';
            }, 2000);
        });

        modal.addEventListener('click', function(e) {
            if (e.target === modal) {
                modal.remove();
            }
        });
    }

    // Add CSS classes for animations
    const style = document.createElement('style');
    style.textContent = `
        .animate-in {
            animation: fadeInUp 0.6s ease-out forwards;
        }
        
        @keyframes fadeInUp {
            from {
                opacity: 0;
                transform: translateY(30px);
            }
            to {
                opacity: 1;
                transform: translateY(0);
            }
        }
    `;
    document.head.appendChild(style);
}); 