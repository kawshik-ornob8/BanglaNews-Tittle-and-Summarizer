document.addEventListener('DOMContentLoaded', () => {
    // Initialize scroll animations
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px'
    };

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('animate__animated', 'animate__fadeInUp');
            }
        });
    }, observerOptions);

    document.querySelectorAll('.card, section').forEach(el => observer.observe(el));

    // Smooth scroll functionality
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function(e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                target.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        });
    });

    // Typing animation function with cursor
    function typeEffect(element, text, speed = 30) {
        element.innerHTML = '<span class="typed-text"></span><span class="cursor"></span>';
        const typedTextSpan = element.querySelector('.typed-text');
        let i = 0;

        function type() {
            if (i < text.length) {
                typedTextSpan.textContent += text.charAt(i);
                i++;
                setTimeout(type, speed);
            }
        }
        type();
    }

    // Error display function
    function showError(message) {
        const errorToast = document.createElement('div');
        errorToast.className = 'error-toast animate__animated animate__fadeInRight';
        errorToast.innerHTML = `
            <div class="toast-content bg-danger text-white p-3 rounded shadow">
                <i class="fas fa-exclamation-circle me-2"></i>${message}
            </div>
        `;
        document.body.appendChild(errorToast);

        setTimeout(() => {
            errorToast.classList.add('animate__fadeOutRight');
            setTimeout(() => errorToast.remove(), 500);
        }, 3000);
    }

    // Form submission handler
    document.getElementById('summarizeForm').addEventListener('submit', async(e) => {
        e.preventDefault();

        const form = e.target;
        const button = form.querySelector('button');
        const spinner = document.getElementById('loadingSpinner');
        const buttonText = document.getElementById('buttonText');
        const resultSection = document.getElementById('resultSection');
        const inputText = document.getElementById('inputText').value;

        if (!inputText.trim()) {
            showError('Please enter some text to analyze');
            return;
        }

        button.disabled = true;
        spinner.classList.remove('d-none');
        buttonText.textContent = 'Analyzing...';
        resultSection.classList.add('d-none');

        try {
            const response = await fetch('/predict', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    text: inputText,
                    type: document.getElementById('outputType').value
                })
            });

            if (!response.ok) throw new Error(`Server error: ${response.status}`);

            const data = await response.json();
            if (data.error) throw new Error(data.error);

            resultSection.classList.remove('d-none');
            resultSection.classList.add('animate__animated', 'animate__fadeInUp');

            const titleElement = resultSection.querySelector('.result-title');
            const contentElement = resultSection.querySelector('.result-content');

            titleElement.textContent = `Generated ${data.type}:`;
            contentElement.textContent = '';
            typeEffect(contentElement, data.result);

            setTimeout(() => {
                resultSection.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }, 500);

        } catch (error) {
            showError(error.message || 'Failed to process request');
        } finally {
            button.disabled = false;
            spinner.classList.add('d-none');
            buttonText.textContent = 'Generate';
        }
    });

    // Add hover effect to cards
    document.querySelectorAll('.card').forEach(card => {
        card.addEventListener('mouseenter', () => {
            card.classList.add('shadow-lg');
        });
        card.addEventListener('mouseleave', () => {
            card.classList.remove('shadow-lg');
        });
    });
});