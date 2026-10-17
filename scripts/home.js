/* home.js - CAROUSEL on the home page
   Idea: keep the number of the slide that is showing (index).
   Showing a slide = hide all slides, then un-hide the one at "index". */

const slides = document.querySelectorAll('#carousel .slide');
const dots = document.querySelectorAll('#dots button');
const prevBtn = document.getElementById('prev');
const nextBtn = document.getElementById('next');
const carousel = document.getElementById('carousel');

let index = 0;
let timer = null;

function showSlide(i) {
  // wrap around: after the last slide go to the first, before the first go to the last
  index = (i + slides.length) % slides.length;

  slides.forEach(function (slide, n) {
    slide.classList.toggle('hidden', n !== index);
  });

  dots.forEach(function (dot, n) {
    // active dot is long and dark, the others are small and light
    dot.className = 'h-2 rounded-full bg-blue-950 ' + (n === index ? 'w-6' : 'w-2 opacity-30');
  });
}

function startAutoPlay() {
  stopAutoPlay();
  timer = setInterval(function () { showSlide(index + 1); }, 4000);
}

function stopAutoPlay() {
  clearInterval(timer);
}

prevBtn.addEventListener('click', function () {
  showSlide(index - 1);
  startAutoPlay(); // restart the 4 second timer after a manual click
});

nextBtn.addEventListener('click', function () {
  showSlide(index + 1);
  startAutoPlay();
});

dots.forEach(function (dot, n) {
  dot.addEventListener('click', function () {
    showSlide(n);
    startAutoPlay();
  });
});

// pause while the mouse is over the carousel
carousel.addEventListener('mouseenter', stopAutoPlay);
carousel.addEventListener('mouseleave', startAutoPlay);

showSlide(0);
startAutoPlay();
