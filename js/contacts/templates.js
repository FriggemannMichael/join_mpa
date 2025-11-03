export function contactDetailTemplate({ name, email, phone, initials, color }) {
  return `
    <div class="contact-big">
      <div class="initials-big" style="background-color:${color};">${initials}</div>
      <div class="name-big">
        <span id="contactDetailName">${name}</span>
        <div class="changebtns">
          <button type="button" id="editContactBtn">
            <img src="./assets/icons/edit.svg" alt="Edit">Edit
          </button>
          <button type="button" id="deleteContactBtn">
            <img src="./assets/icons/delete.svg" alt="Delete">Delete
          </button>
        </div>
      </div>
    </div>
    <div class="contact-big-information">
      <span>Contact Information</span>
      <div class="contact-deep-info">
        <div class="contact-mail">
          <span>E-Mail</span>
          <a id="contactDetailMail" href="mailto:${email}">${email}</a>
        </div>
        <div class="contact-phone">
          <span>Phone</span>
          <a id="contactDetailPhone" href="tel:${phone}">${phone}</a>
        </div>
      </div>
    </div>
  `;
}