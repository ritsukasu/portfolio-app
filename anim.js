// Design-only animations: intro loader + scroll reveal. No app logic here.
window.addEventListener('load', () => {
  setTimeout(() => {
    document.body.classList.add('ready');
    document.querySelector('#loader')?.classList.add('done');
  }, 700);
});

const io = 'IntersectionObserver' in window
  ? new IntersectionObserver((entries) => {
      entries.forEach((e) => {
        if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); }
      });
    }, { threshold: 0.08 })
  : null;

document.querySelectorAll('.reveal').forEach((el, i) => {
  el.style.setProperty('--d', `${(i % 4) * 90}ms`);
  io ? io.observe(el) : el.classList.add('in');
});
