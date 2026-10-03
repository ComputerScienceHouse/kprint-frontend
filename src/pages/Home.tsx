import {
  // useOidcAccessToken,
  // useOidc,
  // useOidcIdToken,
  useOidcFetch,
} from "@axa-fr/react-oidc";
import { useConstCallback } from "powerhooks";
import { useRef, useState } from "react";
import { Alert, Button, Form, FormGroup, Input, Label } from "reactstrap";
// import {Link} from "react-router-dom";
// import Authenticating from "../callbacks/Authenticating";
// import AuthenticationError from "../callbacks/AuthenticationError";
// import SessionLost from "../callbacks/SessionLost";
// import UserInfo from "../UserInfo";
import { PdfControls, PdfPreview } from "../components/PdfPreview";
import { apiPrefix } from "../configuration";
import {
  UserPageSelectionSet,
  addPageToSet,
  removePageFromSet,
  setContainsPage,
} from "../PageSelectionSet";
import "./Home.tsx.css";

type SuccessReply = {
  message: string;
  job_link: string | null;
  job_id: number | null;
};

const Home = () => {
  // important hooks
  // const { accessTokenPayload } = useOidcAccessToken()   // this contains the user info in raw json format
  // const userInfo = accessTokenPayload as UserInfo       //
  // const { idToken, idTokenPayload } = useOidcIdToken()  // this is how you get the users id token
  // const { login, logout, isAuthenticated } = useOidc()  // this gets the functions to login and logout and the logout state

  const { fetch } = useOidcFetch();
  const [message, setMessage] = useState<SuccessReply | null>(null);
  const [copies, setCopies] = useState(1);

  const [pdfWidth, setPdfWidth] = useState(60);
  const splitterRef = useRef<HTMLDivElement | null>(null);

  const pdfControls = useRef<PdfControls>({});

  const onSubmit = useConstCallback((event) => {
    event.preventDefault();
    const formData = new FormData(event.target);
    // const file = formData.get("file");
    formData.delete("file");
    formData.append("title", pdfControls.current?.documentTitle ?? file!!.name);
    console.log(file);
    fetch(
      `${apiPrefix}/printers/${import.meta.env.VITE_PRINTER}/print?${new URLSearchParams(formData as any)}`,
      {
        method: "POST",
        body: file,
      },
    ).then(async (res) => {
      if (res.ok) {
        const json = (await res.json()) as SuccessReply;
        setMessage(json);
      } else {
        console.log("failure", res, await res.text());
      }
    });
  });

  const [colorMode, setColorMode] = useState<"color" | "grayscale">("color");
  const onColorChange = useConstCallback((event) => {
    console.log("Color is uhhh", event.target.value);
    setColorMode(event.target.value);
  });

  const [file, setFile] = useState<File | undefined>();
  const onFileSelected = useConstCallback((event) => {
    console.log("Here's a file!", event);
    setFile(event.target.files[0]);
    console.log("File was set!", event.target.files[0]);
  });

  const [pagesIncluded, setPagesIncluded] = useState<UserPageSelectionSet>({
    text: "",
    validSet: "",
  });

  const onPagesIncludedChanged = useConstCallback((event) => {
    const pagesIncluded = event.target.value;
    let valid = true;
    try {
      setContainsPage(pagesIncluded, 1);
    } catch (err) {
      valid = false;
    }
    console.log("Set pages included gooo", pagesIncluded);
    setPagesIncluded((old) => ({
      text: pagesIncluded,
      validSet: valid ? pagesIncluded : old.validSet,
    }));
  });

  const setPageIncluded = useConstCallback(
    (page: number, included: boolean, pdfPageCount: number) => {
      setPagesIncluded((set) => {
        const newSetText = included
          ? addPageToSet(set.text, page)
          : removePageFromSet(set.text, page, pdfPageCount);
        return { text: newSetText, validSet: newSetText };
      });
    },
  );

  //IDK I was bored. Allows user to resize pdfviewer and form pane

  const startResizing = (event: React.MouseEvent) => {
    event.preventDefault();

    const handleMouseMove = (event: MouseEvent) => {
      if (!splitterRef.current) return;

      const rect = splitterRef.current.getBoundingClientRect();

      const newWidth = ((event.clientX - rect.left) / rect.width) * 100;

      const clampedWidth = Math.min(Math.max(newWidth, 30), 80);

      setPdfWidth(clampedWidth);
    };

    const handleMouseUp = () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };

    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);
  };

  return (
    <div className="pane-splitter" ref={splitterRef}>
      <div className="pdf-pane" style={{ width: `${pdfWidth}%` }}>
        {file ? (
          <PdfPreview
            pdfBlob={file}
            pdfControls={pdfControls.current}
            colorMode={colorMode}
            pagesIncluded={pagesIncluded}
            setPageIncluded={setPageIncluded}
          />
        ) : (
          <div className="pdf-empty">
            <span className="material-icons pdf-empty-icon">description</span>

            <h5>No file selected</h5>
            <p>Select a file to see a preview before printing.</p>
          </div>
        )}
      </div>

      <div className="pane-resizer" onMouseDown={startResizing} />

      <div className="form-pane" style={{ width: `${100 - pdfWidth}%` }}>
        {message && (
          <Alert>
            {message.message}{" "}
            <a href={message.job_link!!}>View Job {message.job_id!!}</a>
          </Alert>
        )}
        <Form onSubmit={onSubmit}>
          <h1 className="title">Print</h1>
          <FormGroup className="input-container">
            <Label for="file" className="input-label">
              File
            </Label>

            <div className="custom-file-input">
              <Label for="file" className="file-button">
                Select File
              </Label>

              <span className="file-name">
                {file ? file.name : "Select a file to print"}
              </span>

              <Input
                id="file"
                name="file"
                type="file"
                onChange={onFileSelected}
                accept=".pdf"
                className="file-input-hidden"
                required
              />
            </div>
          </FormGroup>
          <FormGroup className="input-container">
            <Label for="sides" className="input-label">
              Sides
            </Label>
            <Input id="sides" name="sides" type="select" className="input">
              <option value="one-sided">Single Sided</option>
              <option value="two-sided-long-edge">
                Long Edge Double Sided
              </option>
              <option value="two-sided-short-edge">
                Short Edge Double Sided
              </option>
            </Input>
          </FormGroup>
          <FormGroup className="input-container">
            <Label for="colorMode" className="input-label">
              Color Mode
            </Label>
            <Input
              id="colorMode"
              name="colorMode"
              type="select"
              value={colorMode}
              onChange={onColorChange}
              className="input"
            >
              <option value="color">Color</option>
              <option value="grayscale">Black + White</option>
            </Input>
          </FormGroup>
          <FormGroup className="input-container">
            <Label for="copies" className="input-label">
              Copies
            </Label>

            <div className="number-input input">
              <Input
                id="copies"
                name="copies"
                type="number"
                value={copies}
                min={1}
                onChange={(e) => setCopies(Number(e.target.value))}
                className="input"
              />

              <div className="number-controls">
                <button type="button" onClick={() => setCopies((c) => c + 1)}>
                  <span className="material-icons">keyboard_arrow_up</span>
                </button>

                <button
                  type="button"
                  onClick={() => setCopies((c) => Math.max(1, c - 1))}
                >
                  <span className="material-icons">keyboard_arrow_down</span>
                </button>
              </div>
            </div>
          </FormGroup>
          <FormGroup className="input-container">
            <Label for="pages" className="input-label">
              Page Range
            </Label>
            <Input
              id="pages"
              name="pages"
              type="text"
              value={pagesIncluded.text}
              invalid={pagesIncluded.text != pagesIncluded.validSet}
              onChange={onPagesIncludedChanged}
              placeholder="e.g. 1-5, 8, 11-13"
              className="input"
            />
          </FormGroup>

          <Button type="submit" color="primary" className="w-100">
            Print
          </Button>
        </Form>
      </div>
    </div>
  );
};

export default Home;
