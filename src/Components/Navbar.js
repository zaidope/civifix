import React, { useState, useEffect, useCallback, memo } from "react";
import Container from "react-bootstrap/Container";
import Nav from "react-bootstrap/Nav";
import Navbar from "react-bootstrap/Navbar";
import NavDropdown from "react-bootstrap/NavDropdown";
import { useNavigate } from "react-router-dom";
import { handleLogout } from "../utils/logout";

const isValid = (val) =>
  val && val !== "undefined" && val !== "null" && val.trim() !== "";

function readAuthState() {
  const citizen = localStorage.getItem("citizen_username");
  const admin = localStorage.getItem("admin_username");
  const officer = localStorage.getItem("officer_name");
  return {
    isLoggedIn: isValid(citizen) || isValid(admin) || isValid(officer),
    isAdmin: isValid(admin),
    isOfficer: isValid(officer),
  };
}

function CitizenNavbar() {
  const navigate = useNavigate();
  const [auth, setAuth] = useState(readAuthState);

  const checkAuth = useCallback(() => {
    setAuth(readAuthState());
  }, []);

  useEffect(() => {
    window.addEventListener("auth_changed", checkAuth);
    return () => window.removeEventListener("auth_changed", checkAuth);
  }, [checkAuth]);

  const { isLoggedIn, isAdmin, isOfficer } = auth;

  return (
    <Navbar
      fixed="top"
      collapseOnSelect
      expand="lg"
      variant="dark"
      style={{ padding: "18px 16px", fontSize: "1.02rem" }}
    >
      <Container>
        <Navbar.Brand
          href="/"
          className="text-white font-bold text-xl tracking-wide flex items-center gap-2"
        >
          <svg
            width="28"
            height="28"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="text-indigo-300"
            aria-hidden="true"
          >
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
          </svg>
          <span>CITIZEN GRIEVANCE PORTAL</span>
        </Navbar.Brand>

        <Navbar.Toggle aria-controls="responsive-navbar-nav" />
        <Navbar.Collapse id="responsive-navbar-nav">
          <Nav className="ms-auto text-sm">
            {isLoggedIn ? (
              <div className="flex items-center gap-4">
                {isOfficer && (
                  <Nav.Link
                    href="/officer/dashboard"
                    className="text-white hover:text-indigo-300 transition-colors font-medium"
                  >
                    Officer Dashboard
                  </Nav.Link>
                )}

                {!isAdmin && !isOfficer && (
                  <>
                    <Nav.Link
                      href="/citizen/dashboard"
                      className="text-white hover:text-indigo-300 transition-colors font-medium"
                    >
                      Dashboard
                    </Nav.Link>
                    <Nav.Link
                      href="/track-status"
                      className="text-white hover:text-indigo-300 transition-colors font-medium"
                    >
                      Track Status
                    </Nav.Link>
                    <Nav.Link
                      href="/my-complaints"
                      className="text-white hover:text-indigo-300 transition-colors font-medium"
                    >
                      My Complaints
                    </Nav.Link>
                    <NavDropdown
                      title={<span className="text-white">🏛️ Authorities</span>}
                      id="authorities-nav-dropdown"
                      menuVariant="dark"
                    >
                      <NavDropdown.Item href="/authorities">
                        Urban Local Bodies
                      </NavDropdown.Item>
                      <NavDropdown.Item href="/mla-directory">
                        MLA Directory
                      </NavDropdown.Item>
                    </NavDropdown>
                  </>
                )}

                {isAdmin && (
                  <button
                    type="button"
                    onClick={() => {
                      const removeButton = document.querySelector(
                        "[data-remove-citizen]"
                      );
                      if (removeButton) removeButton.click();
                    }}
                    className="text-white bg-green-500 hover:bg-green-600 transition-all px-4 py-2 rounded-lg text-sm shadow-md font-semibold"
                  >
                    Remove Citizen Account
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => handleLogout(navigate)}
                  className="text-white bg-red-500/20 hover:bg-red-500 hover:text-white transition-all px-4 py-2 rounded-lg border border-red-500/50 shadow-sm text-sm font-semibold ml-2"
                >
                  Logout
                </button>
              </div>
            ) : (
              <>
                <Nav.Link href="/" className="text-white hover:text-indigo-300">
                  Home
                </Nav.Link>
                <Nav.Link href="/about" className="text-white hover:text-indigo-300">
                  About
                </Nav.Link>
                <Nav.Link href="/contact" className="text-white hover:text-indigo-300">
                  Contact
                </Nav.Link>
                <NavDropdown
                  title={<span className="text-white">🏛️ Authorities</span>}
                  id="public-authorities-dropdown"
                  menuVariant="dark"
                >
                  <NavDropdown.Item href="/authorities">
                    Urban Local Bodies
                  </NavDropdown.Item>
                  <NavDropdown.Item href="/mla-directory">
                    MLA Directory
                  </NavDropdown.Item>
                </NavDropdown>
                <Nav.Link href="/register" className="text-white hover:text-indigo-300">
                  Register
                </Nav.Link>
                <NavDropdown
                  title={<span className="text-white">Login</span>}
                  id="collasible-nav-dropdown"
                  menuVariant="dark"
                >
                  <NavDropdown.Item href="/login">Citizen</NavDropdown.Item>
                  <NavDropdown.Item href="/login">Department Officer</NavDropdown.Item>
                  <NavDropdown.Divider />
                  <NavDropdown.Item href="/login">Admin</NavDropdown.Item>
                </NavDropdown>
              </>
            )}
          </Nav>
        </Navbar.Collapse>
      </Container>
    </Navbar>
  );
}

export default memo(CitizenNavbar);
