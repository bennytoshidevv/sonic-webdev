/* home.js - automatic, looping featured menu carousel */

const slides = Array.from(document.querySelectorAll('#slide-track .slide'));
const dots = document.querySelectorAll('#dots button');
const prevBtn = document.getElementById('prev');
const nextBtn = document.getElementById('next');
const carousel = document.getElementById('carousel');
const track = document.getElementById('slide-track');
const slideCount = slides.length;
const firstSlideClone = slides[0].cloneNode(true);

firstSlideClone.setAttribute('aria-hidden', 'true');
track.appendChild(firstSlideClone);

let index = 0;
let timer = null;

function showSlide(i) {
  index = i;
  track.style.transform = 'translateX(-' + (index * carousel.clientWidth) + 'px)';

  dots.forEach(function (dot, n) {
    const isActive = n === index % slideCount;
    dot.classList.toggle('w-6', isActive);
    dot.classList.toggle('w-2', !isActive);
    dot.classList.toggle('opacity-30', !isActive);
    dot.setAttribute('aria-current', String(isActive));
  });
}

track.addEventListener('transitionend', function () {
  if (index === slideCount) {
    track.style.transition = 'none';
    showSlide(0);
    track.offsetHeight;
    track.style.transition = '';
  }
});

function startAutoPlay() {
  stopAutoPlay();
  if (slideCount < 2 || carousel.matches(':hover') || carousel.contains(document.activeElement) || document.hidden) {
    return;
  }
  timer = setInterval(function () { showSlide(index + 1); }, 2000);
}

function stopAutoPlay() {
  clearInterval(timer);
  timer = null;
}

prevBtn.addEventListener('click', function () {
  showSlide((index - 1 + slideCount) % slideCount);
  startAutoPlay();
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

window.addEventListener('resize', function () {
  track.style.transition = 'none';
  showSlide(index);
  track.offsetHeight;
  track.style.transition = '';
});

carousel.addEventListener('mouseenter', stopAutoPlay);
carousel.addEventListener('mouseleave', startAutoPlay);
carousel.addEventListener('focusin', stopAutoPlay);
carousel.addEventListener('focusout', function (event) {
  if (!carousel.contains(event.relatedTarget)) {
    startAutoPlay();
  }
});
document.addEventListener('visibilitychange', startAutoPlay);

showSlide(0);
startAutoPlay();
