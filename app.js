const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
        console.log(entry)
        if (entry.isIntersecting) {
            entry.target.classList.add('show');
        } else{
            entry.target.classList.remove('show')
        }

    });
});
const hiddenItems = document.querySelectorAll('.hidden');
hiddenItems.forEach((el) => observer.observe(el));
const scrollDownClick = document.querySelector('#scroll1')
const scrollDownClick2 = document.querySelector('#scroll2')

function Meow(){
window.scrollBy({
    right:0,
    top:1000,
    behavior:"smooth"})

}
scrollDownClick.onclick = Meow
scrollDownClick2.onclick = Meow


