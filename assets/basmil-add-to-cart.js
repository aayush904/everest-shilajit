// Get all buttons with the class 'add-to-cart-button'
var addToCartButtons = document.querySelectorAll(".add-to-cart-button");

// Use forEach to loop through each button
addToCartButtons.forEach((button) => {
  button.addEventListener("click", async function () {
    // Get the product variant ID from the button's data attribute
    var productId = this.getAttribute("data-product");
    this.innerHTML = `             <svg
              aria-hidden="true"
              focusable="false"
              class="spinner"
              width="25"
              height="25"
              viewBox="0 0 66 66"
              xmlns="http://www.w3.org/2000/svg"
            >
              <circle class="path" fill="none" stroke-width="6" cx="33" cy="33" r="30"></circle>
            </svg>`;
    // Shopify AJAX request to add product to cart
    fetch("/cart/add.js", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        id: productId, // Product Variant ID
        quantity: 1, // Quantity to add
      }),
    })
      .then((response) => response.json())
      .then(async (data) => {
        // Success: Update the UI or show success message
        this.innerText = "Added to Cart!";
        // Get new cart object
        const res = await fetch("/cart.json");
        const cart = await res.json();

        // Update cart count
        document.querySelectorAll(".cart-count-bubble").forEach((el) => {
          el.querySelector(".cart-count").textContent = cart.item_count;
          el.querySelector(".visually-hidden").textContent =
            cart.item_count + cart.item_count == 1 ? "Item" : "Items";
        });
      })
      .catch((error) => {
        // Error: Handle the error
        this.innerText = "Failed to add item to cart.";
        console.error("Error adding item:", error);
      });

    setTimeout(() => {
      this.innerText = "Add to Cart";
    }, 2000);
  });
});
