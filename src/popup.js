const btnOk = document.querySelector(".go-btn");
const btnToggleTheme = document.querySelector(".toggle-theme-btn");
const divText = document.querySelector(".text-div");
let currentTheme = 'dark';


function arrayContainsObject(arr, obj, comparator) {
  return arr.some(item => comparator(item, obj));
}

function isColorEqual(o1, o2) {
  return o1.sum === o2.sum;
}

function isColorEqualStrict(o1, o2) {
  return o1.rgba === o2.rgba;
}


const getUniqColors = (colors) => {
  const ret = [];
  for (const c of colors) {
    if (!arrayContainsObject(ret, c, isColorEqual)) {
      ret.push(c);
    }
  }
  return ret;
};

const renderColors = (colors) => {
  const buf = [''];
  colors.forEach(color => {
    buf.push(`
        <div class="color_box all active">
          <div class="colored-div" style="background-color: ${color.rgba}"></div>
          <div class="color_box-text hex">${color.hex}</div>
          <div class="color_box-text rgb">${color.rgba}</div>
        </div>
      `);
  });
  buf.push(`</div>`);
  return buf.join('');
};

btnOk.addEventListener("click", async () => {
  divText.innerText = 'Analysing...';

  scrapColors().then(data => {
    divText.innerText = '';
    const colors = getUniqColors(
      data.extractedColors
        .map(item=>item.bgColor)
        .concat(
          data.extractedColors
            .map(item=>item.color)
        )
    ).sort((a,b)=> a.sum - b.sum);
    document.querySelector('.content-div').innerHTML = renderColors(colors);
    console.log(data);
    console.log(colors);
    console.log(data.extractedColors.map(item=>item.bgColor).concat(data.extractedColors.map(item=>item.color)));
  })
});

btnToggleTheme.addEventListener("click", async () => {
  currentTheme = currentTheme === 'light' ? 'dark' : 'light';
  document.querySelector('html').setAttribute('data-theme', currentTheme);
});


// Go:
btnOk.click();

//     navigator.clipboard.writeText(csv).then(() => alert(`Data copied do clipboard.`))