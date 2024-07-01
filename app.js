//Hides and Unhides elemnts when in view 
const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
        console.log(entry)
        if (entry.isIntersecting) {
            entry.target.classList.add('show');
        } else {
            entry.target.classList.remove('show')
        }

    });
});
const hiddenItems = document.querySelectorAll('.hidden');
hiddenItems.forEach((el) => observer.observe(el));
const scrollDownClick = document.querySelector('#scroll1')
const scrollDownClick2 = document.querySelector('#scroll2')
// Makes the scrolling effect from the scroll buttons wayyy smoother
function Meow() {
    window.scrollBy({
        right: 0,
        top: 1000,
        behavior: "smooth"
    })

}
scrollDownClick.onclick = Meow
scrollDownClick2.onclick = Meow
// Visual effect for Profile card
const profileCard = document.querySelector(".profile-card")
document.addEventListener("mousemove", (e) => {
    rotateElement(e, profileCard)
})
function rotateElement(event, element) {
    const x = event.clientX
    const y = event.clientY

    const middleX = window.innerWidth / 2;
    const middleY = window.innerHeight / 2;

    const offsetX = ((x - middleX) / middleX) * 40;
    const offsetY = ((y - middleY) / middleY) * 40;

    element.style.setProperty("--rotateX", -1 * offsetY + "deg")
    element.style.setProperty("--rotateY", offsetX + "deg")
}


