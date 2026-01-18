

export function createNavbar(parentId) {
    const navbar = document.createElement("nav");
    navbar.id = "runlab-navbar-div";
    Object.assign(navbar.style, {
      width: "100%",
      height: "100%"
    });

    const ul = document.createElement("ul");
    Object.assign(ul.style, {
        listStyleType: "none",
        margin: "0",
        padding: "0",
        display: "flex"
    });
    navbar.appendChild(ul);

    const menuItems = ["File", "Edit", "View", "Help"];
    menuItems.forEach(item => {
      const li = document.createElement("li"); 
        li.textContent = item;
        ul.appendChild(li);
        Object.assign(li.style, {
            marginRight: "20px",
            padding: "10px 14px",
            cursor: "pointer",
            color: "#fff",
            textDecoration: "none"
        });
    });

    document.getElementById(parentId).appendChild(navbar);
}