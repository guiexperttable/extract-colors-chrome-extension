const btnOk = document.querySelector(".go-btn");
const btnToggleTheme = document.querySelector(".toggle-theme-btn");
const divText = document.querySelector(".text-div");
let currentTheme = 'dark';

btnOk.addEventListener("click", async () => {
  divText.innerText = 'Analysing...';

  scrapColors().then(data => {
    divText.innerText = '';
    document.querySelector('.content-div').innerHTML = data;
    console.log(data)
  })
});

btnToggleTheme.addEventListener("click", async () => {
  currentTheme = currentTheme === 'light' ? 'dark' : 'light';
  document.querySelector('html').setAttribute('data-theme', currentTheme);
});


// Go:
btnOk.click();

//     navigator.clipboard.writeText(csv).then(() => alert(`Data copied do clipboard.`))