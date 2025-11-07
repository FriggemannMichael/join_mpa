/**
 * Removes the "active" class from all elements with class "contact-person".
 * 
 * @returns {void}
 */
export function clearActiveContacts() {
  const contacts = document.querySelectorAll(".contact-person.active");
  contacts.forEach(el => el.classList.remove("active"));
}


/**
 * Reads and trims the value of an input field by its ID.
 * Returns an empty string if the field does not exist.
 *
 * @param {string} id - The ID of the input element to read.
 * @returns {string} The trimmed input value or an empty string if not found.
 */
export function readValue(id) {
    const field = document.getElementById(id);
    return field ? field.value.trim() : "";
}