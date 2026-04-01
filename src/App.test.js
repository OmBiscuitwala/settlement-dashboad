import { render, screen } from "@testing-library/react";
import App from "./App";

jest.mock(
  "react-router-dom",
  () => ({
    BrowserRouter: ({ children }) => <div>{children}</div>,
    Routes: ({ children }) => <div>{children}</div>,
    Route: ({ element }) => element,
    Link: ({ children }) => <span>{children}</span>,
    useNavigate: () => jest.fn(),
    useParams: () => ({ id: "M001" }),
  }),
  { virtual: true }
);

test("renders dashboard shell", async () => {
  render(<App />);
  expect(await screen.findByText(/Merchant Settlement Ops/i)).toBeInTheDocument();
});
