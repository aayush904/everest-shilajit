const selectors = {
  customerAddresses: "[data-customer-addresses]",
  addressCountrySelect: "[data-address-country-select]",
  addressContainer: "[data-address]",
  toggleAddressButton: "button[aria-expanded]",
  cancelAddressButton: 'button[type="reset"]',
  deleteAddressButton: "button[data-confirm-message]",
};

const attributes = {
  expanded: "aria-expanded",
  confirmMessage: "data-confirm-message",
};

class CustomerAddresses {
  constructor() {
    this.elements = this._getElements();
    if (Object.keys(this.elements).length === 0) return;
    this._setupCountries();
    this._setupEventListeners();
  }

  _getElements() {
    const container = document.querySelector(selectors.customerAddresses);
    return container
      ? {
          container,
          addressContainer: container.querySelector(selectors.addressContainer),
          toggleButtons: document.querySelectorAll(
            selectors.toggleAddressButton
          ),
          cancelButtons: document.querySelectorAll(
            selectors.cancelAddressButton
          ),
          deleteButtons: container.querySelectorAll(
            selectors.deleteAddressButton
          ),
          countrySelects: container.querySelectorAll(
            selectors.addressCountrySelect
          ),
        }
      : {};
  }

  _setupCountries() {
    if (Shopify && Shopify.CountryProvinceSelector) {
      // eslint-disable-next-line no-new
      new Shopify.CountryProvinceSelector(
        "AddressCountryNew",
        "AddressProvinceNew",
        {
          hideElement: "AddressProvinceContainerNew",
        }
      );
      this.elements.countrySelects.forEach((select) => {
        const formId = select.dataset.formId;
        // eslint-disable-next-line no-new
        new Shopify.CountryProvinceSelector(
          `AddressCountry_${formId}`,
          `AddressProvince_${formId}`,
          {
            hideElement: `AddressProvinceContainer_${formId}`,
          }
        );
      });
    }
  }

  _setupEventListeners() {
    this.elements.toggleButtons.forEach((element) => {
      element.addEventListener("click", this._handleAddEditButtonClick);
    });
    this.elements.cancelButtons.forEach((element) => {
      element.addEventListener("click", this._handleCancelButtonClick);
    });
    this.elements.deleteButtons.forEach((element) => {
      element.addEventListener("click", this._handleDeleteButtonClick);
    });
  }
  _toggleExpanded(target) {
    target.setAttribute(
      attributes.expanded,
      (target.getAttribute(attributes.expanded) === "false").toString()
    );

    document
      .querySelectorAll(".addresses [aria-expanded=true]")
      .forEach((element) => {
        if (element !== target) {
          element.setAttribute(attributes.expanded, "false");
        }
      });

    const expanded = document.querySelector(
      ".addresses [aria-expanded=true]~div[id]"
    );
    const portal = document.getElementById("form-portal");
    if (expanded) {
      portal.innerHTML = expanded.innerHTML;
      portal.style.width = "76.8rem";
      portal.style.padding = "2.5rem 1.5rem 0 1.5rem";
      portal.scrollIntoView({ behavior: "smooth", block: "start" });
      portal.style.marginRight = "0";
    } else {
      portal.style.padding = "0";
      portal.innerHTML = "";
      portal.style.marginRight = "-100px";
      portal.style.width = "0";
    }
  }

  _handleAddEditButtonClick = ({ currentTarget }) => {
    this._toggleExpanded(currentTarget);
  };

  _handleCancelButtonClick = ({ currentTarget }) => {
    const portal = document.getElementById("form-portal");
    portal.style.padding = "0";
    portal.innerHTML = "";
      portal.style.marginRight = "-100px";
      portal.style.width = "0";

    document
      .querySelectorAll(".addresses [aria-expanded=true]")
      .forEach((element) => {
        element.setAttribute(attributes.expanded, "false");
      });


  };

  _handleDeleteButtonClick = ({ currentTarget }) => {
    // eslint-disable-next-line no-alert
    if (confirm(currentTarget.getAttribute(attributes.confirmMessage))) {
      Shopify.postLink(currentTarget.dataset.target, {
        parameters: { _method: "delete" },
      });
    }
  };
}
