/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.  */

var abRevision = '170926.15';


// Fields options
let abEmail = { key: "email", name: "Email", options: ["Work", "Home"] };
let abPhone = { key: "tel", name: "Phone", options: ["Mobile", "Home", "Work", "Fax", "Pager"] };
let abAddress = { key: "adr", name: "Address", options: ["Home", "Work"] };
let abWebpage = { key: "url", name: "Webpage", options: ["Home", "Work"] };
let abChat = { key: "chat",
  name: "Chat",
  options: [
    "Google Talk",
    "AIM (R)",
    "Yahoo",
    "Skype",
    "QQ",
    "MSN",
    "ICQ",
    "Jabber ID",
    "IRC Nick"
  ]
};

/* eslint-disable no-unused-vars    */

// The address fields available  (as with RFC)
let AddressFields = [
  "PostBox",
  "ExtendedAdr",
  "Street",
  "City",
  "Region",
  "PostalCode",
  "Country"
];

let ContactSections = [abEmail, abPhone, abAddress, abWebpage, abChat];
let PersonalSections = [
  "name",
  "nickname",
  "n",
  "bday",
  "anniversary",
  "gender",
  "rev",
  "note",
  "categories",
  "fn"
];

let CategoryStandard = ["Privat", "Friends"];
let CategoryCollection = [];

/* eslint-disable indent */


let AddressBook = React.createClass({
  getInitialState: function() {
    let contactSections = ContactParser.createEmptyContactSections(
      this.props.contactSections
    );
    let personalSections = ContactParser.createEmptyPersonalSections(
      this.props.personalSections
    );

    return {
      abRev: "Welcome to vContacts  rev:" + abRevision,
      abStatus: "",
      abError: "",

      contactsList: [],
      listId: null,
      listIdLast: null,
      selectedIds: [],
      contact: null,
      name: null,

      editing: false,
      photoUrl: "images/xContact.png",

      contactSections: contactSections,
      personalSections: personalSections,

      searchItem: "",
      tagItem: "",

      tagCollection: { CategoryCollection },
      hhStyle: false,
      tagSupportStatus: 'display: none',

      goModals: { deleteContact: false, deleteDB: false },

      modalIsOpen: false,
      selectedMailto: ""
    };
  },

  componentDidMount: function() {
    this.loadInContacts();
  },

  componentWillMount: function() {
    ReactModal.setAppElement("body");
  },

  loadInContacts: function() {
    DatabaseConnection.loadInContacts(this);
  },

  addContact: function() {
    //         Should directly open the imported contact                        //TODO
    let self = this;
    Addressbook.open(indexedDB)
      .then(function() {
        AddressbookUtil.newContact(self);
      })
      .then(self.loadInContacts)
      .then(function() {
        DatabaseConnection.getContactDetails(
          DatabaseConnection.lastContactId + 1,
          self
        );
      });
  },


  searchNames: function(event) {
    let self = this;

    self.setState({ searchItem: event.target.value });
    Addressbook.open(indexedDB)
      .then(self.loadInContacts);
  },


  clearSearchNames: function(event) {
    let self = this;
    document.getElementById('searchNames').value = ""; //XXXX direct access ?? OK?

    self.setState({
      searchItem: ""
    });
    Addressbook.open(indexedDB)
      .then(self.loadInContacts);
  },


  searchTags: function(event) {
    let self = this;

    let sTag = event.target.value === "%none%" ? "" : event.target.value;
    self.setState({ tagItem: sTag });
    Addressbook.open(indexedDB)
      .then(self.loadInContacts);
  },


  import: function(file) {
    let self = this;
    Addressbook.open(indexedDB)
      .then(function() {
        AddressbookUtil.importContacts(self);
      })
      .then(self.loadInContacts);
  },

  export: function() {
    let self = this;
    DatabaseConnection.export(this.state.selectedIds, self);
  },



  tag_Support: function() {
    // tbd     Called from Hambg --> this will maintain the Tag List            //TODO
    console.log("tag_Support ... tbd ... ");

    this.setState({
      tagSupportStatus: 'display: none'
    });
  },

  editContact: function() {
    this.setState({ editing: true });
  },


  closeContacts: function() {
    DatabaseConnection.closeContact(this);
  },

  addContactDetail: function(index) {
    ContactParser.addContactDetail(this, index);
  },

  removeContactDetail: function(index, fieldID) {
    ContactParser.removeContactDetail(this, index, fieldID);
  },

  makeFirst: function(index, fieldID) {
    // console.log(" ab  makeFirst", index, fieldID);
    ContactParser.makeFirst(this, index, fieldID);
  },

  // this reads the UI for the contacts PersonalSection and contactSection
  // to update the db
  editSave: function() {
    DatabaseConnection.updateContact(this);
  },

  editCancel: function() {
    ContactParser.cancelContactEdit(this);
  },

  updateContent: function(newText, index, fieldID) {
    ContactParser.updateContent(this, index, fieldID, newText);
  },

  updatePersonalDetail: function(detail, newText) {
    ContactParser.updatePersonalDetail(this, detail, newText);
  },

  updateOption: function(option, index, fieldID) {
    ContactParser.updateOption(this, option, index, fieldID);
  },

  updateProfileImage: function(image) {
    ContactParser.updateProfileImage(this, image);
  },

  setContactID: function(event, id, name, uid, listId) {
    var self = this;
    let log, selected, index, listIdLast;

    // don't change 'contact' if editing is active
    if (this.state.editing === true) {
      return;
    }

    selected = this.state.selectedIds;

    // *** debugging use ***
    //   On sidebar select the contact,
    //   with  [Shift] [Alt] cursor click show the raw vCard data
    if (event.altKey && event.shiftKey && selected.length === 1) {
      this.showContactRaw(listId);
    } else

    // mark contacts on sidebar for further action(s)
    if ((event.ctrlKey || event.metaKey) && selected.length > 0) {
      index = selected.indexOf(id);
      if (index === -1) {
        // selects contact
        selected.push(id);
        listIdLast = listId;
      } else {
        // deselects contact
        selected.splice(index, 1);
      }

      log = ("Contacts selected  " + selected.length + " : " +
        selected.toString()).trunc(42) + ' ' + listId;
      //console.log(log); //XXXX

      this.setState({
        selectedIds: selected,
        listIdLast: listId,
        abStatus: (log)
      });
    } else

    // build selectedIds from first to last selected contact using shift cursor select
    if (event.shiftKey) {
      var nextId, first = self.state.listIdLast, last = listId;
      if (first > last) {
        first = listId;
        last = self.state.listIdLast;
      }
      for (var i= first; i < last + 1; i++) {
        nextId = self.state.contactsList[i].id;
        if (selected.indexOf(nextId) == -1)
          selected.push(nextId);
      }

      log = "Contacts selection of items: " + selected.length;
      //console.log(log); //XXXX

      this.setState({
        selectedIds: selected,
        listId: listId,
        listIdLast: listId,
        abStatus: (log)
      });

    } else {
      // open the selected contact to display/edit/etc it's details
      this.setState({
        selectedIds: [id],
        name: name,
        listId: listId,
        listIdLast: listId
      });
      DatabaseConnection.getContactDetails(id, this);
    }
  },

  showContactRaw: function(listId) {
    let log =
      "  Display vCard source :  " +
      this.state.contact.name +
      "  uuid:" +
      this.state.contact.uuid +
      "  (listId:" +
      listId +
      ")\n" +
      JSON.stringify(this.state.contact).replace(/\],\[/g, "\n");
    alert(log); //          change to normal dialog not 'alert'               //TODO
    console.log(log);
  },


  editingDisplay: function() {
    if (!this.state.editing) {
      return (
        <div id="main-buttons" className="verticalButtons">
          <button className="buttons" onClick={this.closeContacts}>
            Close
          </button>

          <div className="flexx1"/>

          <button className="buttons" onClick={this.editContact}>
            Edit
          </button>

          <div className="flexx1"/>

          <button
            className="buttons"
            onClick={this.goModals.bind(null, "deleteContact")}>
            Delete
          </button>
        </div>
      );
    } else {
      return (
        <div id="main-buttons" className="verticalButtons">
          <button className="buttons" onClick={this.editSave}>
            Save
          </button>

          <div className="flexx1"/>

          <button className="buttons" onClick={this.editCancel}>
            Cancel
          </button>

          <div className="flexx1"/>
        </div>
      );
    }
  },

  notesChanged: function(e) {
    let eValue = e.currentTarget.value;
    let notes = this.state.personalSections.note.content;
    this.setState({
      notes: eValue
    });
    this.notesContent = eValue;
  },

  notesContent: "",

  renderNotes: function() {
    this.notesContent = this.state.personalSections.note.content;
    return (
      <div className="contact-section">
        <div className="contact-group">
          {"Notes"}
        </div>
        <NotesSection
          editing={this.state.editing}
          notesContent={this.notesContent}
          notesChanged={this.notesChanged}
          personalDetails={this.state.personalSections}
        />
        <div></div>
      </div>
    );
  },

  addTag: function(event) {
    let contact, tDetails, allTags, uniTags;
    let newTag = event.target.value;
    if (newTag === "" || newTag === "%none%") {
      return;
    }

    tDetails = this.state.personalSections;
    contact = this.state.contact;

    if (tDetails.categories.property === null) {
      contact.jcards[0].addPropertyWithValue("categories", newTag);
      tDetails.categories.property = new ICAL.Property("categories");
      tDetails.categories.property.jCal[3] = [newTag];
    } else {
      allTags = tDetails.categories.property.jCal[3];
      if (typeof allTags === "string") {
        allTags = [allTags];
      }

      uniTags = allTags.filter(function(e) {
        return e !== newTag;
      });
      uniTags.push(newTag);
      tDetails.categories.property.jCal[3] = uniTags;
    }

    this.setState({
      personalSections: tDetails
    });
    document.getElementById("tagsSelection").options.selectedIndex = 0;
  },

  removeTag: function(thisTag) {
    let delTag = thisTag.target.previousElementSibling.textContent;

    let currentSection = this.state.personalSections;

    let allTags = currentSection.categories.property.jCal[3];
    if (typeof allTags === "string") {
      allTags = [allTags];
    }

    let uniTags = allTags.filter(function(e) {
      return e !== delTag;
    });

    currentSection.content = uniTags.join(",");
    currentSection.categories.property.jCal[3] = uniTags;

    this.setState({
      currentSection: currentSection
    });
  },

  renderContactTags: function() {

    let self = this;
    let removeButton, addButton, pCategories, jCategories;
    removeButton = "buttons nobutton";
    addButton = "buttons nobutton";

    if (this.state.editing) {
      removeButton = "buttons remove";
      addButton = "buttons add";
    }
    pCategories = this.state.personalSections.categories;

    // without 'categories' do noting
    if (!pCategories) {
      return;
    }
    if (!pCategories.property) {
      return;
    }

    //this.state.personalSections.categories.property.jCal[3]
    //Array [ "Business", "Golf" ]      needs to be Array! If not make Array

    jCategories = pCategories.property.jCal[3];

    if (typeof jCategories === "string") {
      jCategories = [jCategories];
    }

    let uCategories = AddressbookUtil.unique(jCategories);

    return (
      <div>
        {" "}{uCategories.map(function(nextCat) {
          return (
            <div>
              <button className="tag">
                {nextCat}
              </button>
              <button className={removeButton} onClick={self.removeTag}>
                {" "}-{" "}
              </button>
            </div>
          );
        })}
      </div>
    );
  },


  goModals: function(type, mode) { // mode = true for 'open',   = false for 'close'
    let _Modals = this.state.goModals;
    _Modals[type] = mode || false;
    this.setState({ goModals: _Modals });
  },

  delete_Contact: function() {
    this.goModals("deleteContact", true);
  },

  deleteContact: function() {
    var self = this;
    self.goModals("deleteContact");
    DatabaseConnection.deleteContacts(self.state.selectedIds, this);
    self.setState({
      selectedIds: [], // unselects any selected contacts
    });
    self.loadInContacts();
  },


  delete_DB: function() {
    this.goModals("deleteDB", true);
  },

  deleteDB: function() {
    indexedDB.deleteDatabase("addrbook");

    document.getElementById("dbdelete").setAttribute("style", "display: none");
    document.getElementById("closeTag").setAttribute("style", "display: block");
  },

  renderGoModals: function() {
    if (this.state.goModals.deleteContact) {
      return (
        <ContactDelete
          selectedIds={this.state.selectedIds}
          noGo={this.goModals.bind(null, "deleteContact", false)}
          confirmed={this.deleteContact}
        />
      );
    }

    if (this.state.goModals.deleteDB) {
      return (
        <DBdelete
          noGo={this.goModals.bind(null, "deleteDB", false)}
          confirmed={this.deleteDB}
        />
      );
    }

  },


  openMailto() {
    var self = this;
    var mode;

    var selected = self.state.selectedIds;
    DatabaseConnection.mailtoAdr(selected, self);
  },

  closeMailto() {
    this.setState({ modalIsOpen: false });
  },

  onRequestMailto(mode) {
    let allMailto = this.state.selectedMailto;

    var cTextarea = document.querySelector('.currentMailto');
    cTextarea.select();
    let edited = cTextarea.value;

    if ((mode == 'CC') || (mode == 'BCC')) {
      location.href = "mailto:?" + mode +"=" + edited;
    } else if (mode == 'C&P') {
      var successful = document.execCommand('copy');
    } else {
      location.href = "mailto:" + edited;
    }
    this.closeMailto();
  },


  renderMailto: function() {
    return (
      <MailTo
        isOpen={this.state.modalIsOpen}
        onRequestClose={this.closeMailto}
        onRequestMailto={this.onRequestMailto}
        selectedIds={this.state.selectedIds}
        selectedMailto={this.state.selectedMailto}
      />
    );
  },


  showHH: function() {
    document
      .getElementById("hambgMenu")
      .setAttribute("class", "hambgMenu show");
  },

  closeHH: function() {
    document
      .getElementById("hambgMenu")
      .setAttribute("class", "hambgMenu");
  },

  errorLink: function() {
    alert("vContact " + this.state.abError); //XXXX    change Alert dialog!
    document.getElementById("errorStatus").style.display = "none";
  },

  renderContactSection: function(contactSection) {
    if (this.state.editing) {
      return (
        //           edit mode
        <ContactSection
          editing={this.state.editing}
          type={contactSection.name}
          options={contactSection.options}
          index={contactSection.index}
          fields={this.state.contactSections[contactSection.index].fields}
          save={this.editSave}
          addContactDetail={this.addContactDetail}
          removeContactDetail={this.removeContactDetail}
          makeFirst={this.makeFirst}
          updateOption={this.updateOption}
          updateContent={this.updateContent}
          key={"contact" + contactSection.index}
        />
      );
    } else {
      return (
        //         display mode
        <ContactSection
          editing={this.state.editing}
          type={contactSection.name}
          options={contactSection.options}
          index={contactSection.index}
          fields={contactSection.fields}
          save={this.editSave}
        />
      );
    }
  },

  /*
   * Layout for NOT selected any contact
   */
  renderNoContact: function() {
    var self = this;
    return (
      <div id="ab-window" className="abWindow">
        <div id="ab-Container">
          {self.renderGoModals()}
          {self.renderMailto()}

          <HHmenu
            closeHH={self.closeHH}
            addContact={self.addContact}
            tag_Support={self.tag_Support}
            import={self.import}
            export={self.export}
            delete_Contact={self.delete_Contact}
            delete_DB={self.delete_DB}
            abRev={self.state.abRev}
            openMailto={self.openMailto}
          />


        <div id="ab-sidebar" className="abSidebar">
            <AB_header
              hamburger={self.hamburger}
              showHH={self.showHH}
              exportContact={self.export}
              abStatus={(self.state.abStatus).trunc(42)}
              abError={(self.state.abError)}
              errorLink={self.errorLink}
            />

            <ContactSidebar
              contactHeader={self.state.headerList}
              contactNames={self.state.contactsList}
              viewContact={self.setContactID}
              image={self.state.photoUrl}
              add={self.addContact}
              searchNames={self.searchNames}
              clearNames={self.clearSearchNames}
              searchTags={self.searchTags}
              tagCollection={CategoryCollection}
            />
          </div>

          <div id="ab-main" className="abMain">
            <div className="abMainNoContact">
              <img src="images/xContact.png" className="mainImg" />
              <button
                className="buttons centerBlock"
                onClick={self.addContact}
              >
                {"+"}
              </button>
              <div className="centerText">Add a new Contact</div>
            </div>
          </div>
        </div>
      </div>
    );
  },

  renderTagSelector: function() {
    return (
      <option id="tagsSelection0" defaultValue={"%none%"}>
        {"Add Tag"}
      </option>
    );
  },

  renderTags: function(tag) {
    return (
      <option defaultValue={tag}>
        {tag}
      </option>
    );
  },

  /*
   * Layout for a SELECTED contact
   */
  renderContactDisplay: function() {
    let self = this;
    let tags, tagsStatus, removeButton, addButton;

    let displayFlex = { display: "flex" };
    let displayNone = { display: "none" };

    tags = CategoryCollection;
    tagsStatus = displayNone;

    removeButton = "buttons nobutton";
    addButton = "buttons nobutton";

    if (self.state.editing) {
      removeButton = "buttons remove";
      addButton = "buttons add";
      tagsStatus = displayFlex;
    }

    return (
      <div id="ab-Container">
        <div id="ab-window" className="abWindow">
          {self.renderGoModals()}
          {self.renderMailto()}

          <HHmenu
            closeHH={self.closeHH}
            addContact={self.addContact}
            tag_Support={self.tag_Support}
            import={self.import}
            export={self.export}
            showContactRaw={self.showContactRaw}
            delete_Contact={self.delete_Contact}
            delete_DB={self.delete_DB}
            abRev={this.state.abRev}
            openMailto={self.openMailto}
          />


        <div id="ab-sidebar" className="abSidebar">
            <AB_header
              hamburger={self.hamburger}
              showHH={self.showHH}
              abStatus={(this.state.abStatus).trunc(42)}
              abError={(this.state.abError)}
              errorLink={this.errorLink}
            />

            <ContactSidebar
              contactHeader={self.state.headerList}
              contactNames={self.state.contactsList}
              viewContact={self.setContactID}
              selected={self.state.selectedIds}
              image={self.state.photoUrl}
              searchNames={self.searchNames}
              clearNames={self.clearSearchNames}
              searchTags={self.searchTags}
              tagCollection={CategoryCollection}
            />
          </div>

          <div id="ab-main" className="abMain">
            <div id="ab-main-header" className="abMainHeader">
              <ContactHeader
                personalDetails={self.state.personalSections}
                onUserInput={self.updatePersonalDetail}
                onNewImage={self.updateProfileImage}
                editing={self.state.editing}
                image={self.state.photoUrl}
              />

              <div className="flexx1"/>

              <div id="ab-main-tagSection" className="abMainTagSection">
                <div id="ab-main-tagEdit">
                  <img
                    className="glyphicons"
                    src="images/glyphicons_065_tag.png"
                  />
                <description className="textTags"> Tags </description>
                </div>

                <div style={tagsStatus}>
                  <select
                    id="tagsSelection"
                    onChange={self.addTag}
                    className="searchTagsSelect"
                  >
                    {self.renderTagSelector()}
                    {tags.map(self.renderTags)}
                  </select>
                </div>

                <div id="ab-main-tags" className="abMainTags">
                  {self.renderContactTags()}
                </div>
              </div>

              {self.editingDisplay()}
            </div>

            <div id="ab-main-sections" className="abMainSections">
              {self.state.contactSections.map(self.renderContactSection)}
              {self.renderNotes()}
            </div>
          </div>
        </div>
      </div>
    );
  },

  render: function() {
    let self = this;
    if (self.state.selectedIds.length === 0) {
      // console.log("NO CONTACT VIEW");
      return self.renderNoContact();
    } else {
      // console.log("CONTACT VIEW");
      return self.renderContactDisplay();
    }
  },

});

ReactDOM.render(
  <AddressBook
    contactSections={ContactSections}
    personalSections={PersonalSections}
    tagCollection={CategoryCollection}
  />,
  document.getElementById("addressBook")
);
