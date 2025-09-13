// Apply profile configuration
function applyProfileConfig() {
    // Profile card
    const profileName = document.querySelector('.profile-card h2');
    const profileDesc = document.querySelector('.profile-card p');
    if (profileName && profileDesc) {
        profileName.textContent = profileConfig.name;
        profileDesc.innerHTML = `${profileConfig.title}<br>${profileConfig.bio}`;
    }

    // About section
    const aboutText = document.querySelector('.about');
    if (aboutText) {
        aboutText.textContent = `Hey, I'm ${profileConfig.name} and welcome to my portfolio page. ${profileConfig.bio}`;
    }
}

// Initialize configs when document loads
document.addEventListener('DOMContentLoaded', () => {
    applyProfileConfig();
});
