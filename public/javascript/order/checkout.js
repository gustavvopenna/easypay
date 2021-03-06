/* Logic */
let taps = 1;
let orderProducts = null;

// DOM Nodes
$previewPayment = document.getElementById('preview-payment');
$previewPayment.onclick = previewPayment;

/* CRUD */

// Read
function readOrder() {
  axios.get(`${HOSTNAME}/api/order/${ORDER_ID}`).then(({ data: order }) => {
    const { products, productsQty, payments } = order;
    const allProducts = products
      .map((product, index) => {
        return new Array(productsQty[index]).fill(product);
      })
      .flat();

    orderProducts = allProducts;

    renderOrder();
    renderCodes(payments);
  });
}

/* Helpers */
function updateTotalTaps(n) {
  const $input = document.getElementById('taps');
  const value = Math.max(Number($input.value) + n, 1);

  $input.value = value;
  taps = value;

  renderOrder();
}

function updateTap(el) {
  const { id, tap } = el.dataset;
  const $product = document.getElementById(id);
  const $input = $product.querySelector('input');
  const buttons = [...$product.querySelectorAll('button')];

  buttons.forEach((button, i) => {
    if (i === Number(tap)) {
      button.classList.add('is-link');
    } else {
      button.classList.remove('is-link');
    }
  });

  $input.value = tap;
}

function previewPayment() {
  const $taps = document.getElementById('checkout-list').querySelectorAll('input');
  const tapsElements = [...$taps];
  const taps = {};

  tapsElements.forEach(element => {
    const { value: tap } = element;
    const { product, price } = element.dataset;

    if (!taps[tap]) {
      taps[tap] = {
        tap,
        products: [],
        amount: 0
      };
    }

    taps[tap].products.push(product);
    taps[tap].amount += Number(price);
  });

  axios
    .put(`${HOSTNAME}/api/order/${ORDER_ID}/payment`, {
      taps
    })
    .then(({ data: payments }) => {
      renderCodes(payments);
    });
}

function renderCodes(payments) {
  $paymentsList = document.getElementById('payments');

  if (payments.length === 0) {
    $paymentsList.innerHTML = '<p>Please select the order taps.</p>';
  } else {
    $paymentsList.innerHTML = '';

    payments.forEach(payment => {
      $paymentsList.innerHTML += renderPayment(payment);
    });
  }
}

function renderPayment(payment) {
  const url = `${HOSTNAME}/payments/${payment._id}`;
  const codeActive = !payment.complete;
  const code = generateQRCode(url, codeActive);

  return `
    <div class="column is-one-third">
      <div class="box has-text-centered">
        
          <h1 class="title">Tap no. ${payment.tap + 1}</h1>
          <figure>
            <a href="${HOSTNAME}/payments/${payment._id}">
            <img src="${code}" />
            </a>
            <figcaption class="title">Total ${payment.amount.toFixed(2)}</figcaption>
          </figure>
        
      </div>
    </div>
  `;
}

function generateQRCode(url, active) {
  return new QRious({
    background: 'rgb(255, 255, 255)',
    foreground: active ? 'rgb(255, 56, 96)' : 'rgb(90, 90, 90)',
    level: 'L',
    size: 300,
    value: url
  }).toDataURL();
}

// Render
function renderOrder() {
  const $checkoutTable = document.getElementById('checkout-list');
  $checkoutTable.innerHTML = orderProducts.map(renderProductRow).join('');
}

function renderProductRow(product, index) {
  const renderButton = (n, i) => {
    return `<button data-id="${product._id}-${index}" data-tap="${i}" onclick="updateTap(this)" class="button ${
      i === 0 ? 'is-link' : ''
    }">${i + 1}</button>`;
  };

  const tapButtons = new Array(taps)
    .fill()
    .map(renderButton)
    .join('');

  return `
  <tr id="${product._id}-${index}">
    <td>${product.name}</td>
    <td>${product.price.toFixed(2)}</td>
    <td>
      <input type="text" name="tap" value="0" data-product="${product._id}" data-price="${product.price}" hidden/>
      ${tapButtons}
    </td>
  </tr>`;
}
