const profilePicture = document.querySelector('#profilePicture');
const deletePicture = document.querySelector('#deletePicture');

if (deletePicture) {
  profilePicture.addEventListener('change', function () {
    deletePicture.disabled = Boolean(this.value);
  });

  deletePicture.addEventListener('change', function () {
    profilePicture.disabled = Boolean(this.checked);
  });
}
