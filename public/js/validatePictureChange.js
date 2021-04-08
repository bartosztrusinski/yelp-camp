const profilePicture = document.querySelector('#profilePicture')
    , deletePicture = document.querySelector('#deletePicture');

if(deletePicture) {
    profilePicture.addEventListener('change', function() {
        deletePicture.disabled = !!this.value;
    });
    deletePicture.addEventListener('change', function() {
        profilePicture.disabled = !!this.checked;
    });
}