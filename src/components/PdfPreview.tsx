import * as pdfjsLib from "pdfjs-dist";
import {
  RenderingCancelledException,
  PDFDocumentProxy,
  PDFPageProxy,
} from "pdfjs-dist";
import {Button} from "reactstrap";
import AutoSizer from "react-virtualized-auto-sizer";
import {VariableSizeList} from "react-window";
import {useMemo, useState, useEffect, useRef} from "react";
import {useConstCallback} from "powerhooks";
import "./PdfPreview.tsx.css";
import PdfJsWorker from "pdfjs-dist/build/pdf.worker?worker&url";

const PADDING_BETWEEN_PAGES = 8 + 8;

pdfjsLib.GlobalWorkerOptions.workerSrc = PdfJsWorker;

function PdfPage({
  data,
  index,
  style,
}: {
  data: {
    pdfDocument: PDFDocumentProxy;
    pages: PDFPageProxy[];
    scale: number;
    maxWidth: number;
    colorMode: "grayscale" | "color";
  };
  index: number;
  style: Object;
}) {
  const page = data.pages[index];
  const scale = data.scale;
  const maxWidth = data.maxWidth;
  const colorMode = data.colorMode;

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const contextRef = useRef<CanvasRenderingContext2D | null>(null);
  useEffect(() => {
    if (canvasRef.current) {
      contextRef.current = canvasRef.current.getContext("2d");
    }
  }, [canvasRef.current]);

  const outputScale = window.devicePixelRatio || 1;
  const viewport = page.getViewport({scale});
  const [renderOutcome, setRenderOutcome] = useState<
    {state: "pending" | "finished"} | {state: "error"; error: any}
  >({state: "pending"});

  useEffect(() => {
    if (!contextRef.current) {
      return;
    }
    setRenderOutcome({state: "pending"});
    const transform =
      outputScale !== 1 ? [outputScale, 0, 0, outputScale, 0, 0] : undefined;
    const renderTask = page.render({
      canvasContext: contextRef.current,
      transform,
      viewport,
    });
    let cancelled = false;
    renderTask.promise
      .catch((error) => {
        if (error instanceof RenderingCancelledException && cancelled) {
          return;
        }
        console.error(`Rendering page ${index} failed`, error);
        setRenderOutcome({state: "error", error});
      })
      .then(() => {
        setRenderOutcome({state: "finished"});
      });
    return () => {
      cancelled = true;
      renderTask.cancel();
    };
  }, [contextRef.current, page, scale]);

  return (
    <div className="page" style={style}>
      <div className="page-container">
        <div className="page-filler" style={{width: maxWidth + "px"}}>
          <div className="page-sheet">
            <div className="page-message-overlay">
              {renderOutcome.state != "finished" && (
                <div className="page-message-container">
                  {renderOutcome.state == "error" && (
                    <div className="page-error">
                      {renderOutcome.error.message ??
                        "An unknown error occurred"}
                    </div>
                  )}
                  {renderOutcome.state == "pending" && (
                    <div className="page-loading">Loading</div>
                  )}
                </div>
              )}
            </div>
            <canvas
              ref={canvasRef}
              height={viewport.height * outputScale}
              width={viewport.width * outputScale}
              style={{
                width: viewport.width + "px",
                height: viewport.height + "px",
                filter:
                  colorMode == "grayscale" ? "grayscale(100%)" : undefined,
              }}
              className="page-canvas"
            />
          </div>
        </div>
      </div>
    </div>
  );
}

type PdfControls = {
  zoom: (amount: number | "reset") => unknown;
};

export function PdfPreview({
  pdfBlob,
  colorMode,
}: {
  pdfBlob: File;
  colorMode: "color" | "grayscale";
}) {
  const [documentState, setDocumentState] = useState<
    {pdfDocument: PDFDocumentProxy; pages: PDFPageProxy[]} | undefined
  >();
  useEffect(() => {
    setDocumentState(undefined);
    let cancellation = () => loadingTask.destroy();
    const loadingTask = pdfjsLib.getDocument(URL.createObjectURL(pdfBlob));
    loadingTask.promise
      .then(async (pdfDocument) => {
        cancellation = () => pdfDocument.destroy();
        return {
          pages: await Promise.all(
            new Array(pdfDocument.numPages)
              .fill(null)
              .map((_, i) => pdfDocument.getPage(i + 1)),
          ),
          pdfDocument,
        };
      })
      .then((documentState) => {
        cancellation = async () => {
          for (const page of documentState.pages) {
            page.cleanup();
          }
          await documentState.pdfDocument.destroy();
        };
        setDocumentState(documentState);
      });

    return () => {
      cancellation();
    };
  }, [pdfBlob]);

  const pdfControls = useRef<PdfControls>({});
  const increaseZoom = useConstCallback(() => {
    pdfControls.current?.zoom(0.1);
  });
  const reduceZoom = useConstCallback(() => {
    pdfControls.current?.zoom(-0.1);
  });
  const resetZoom = useConstCallback(() => {
    pdfControls.current?.zoom("reset");
  });

  if (!documentState) {
    return <div>Loading Document</div>;
  }

  return (
    <div className="pdf-preview">
      <div className="pdf-toolbar">
        <Button onClick={increaseZoom}>+</Button>
        <Button onClick={reduceZoom}>-</Button>
        <Button onClick={resetZoom}>Reset Zoom</Button>
      </div>
      <div className="pdf-scrollview">
        <AutoSizer>
          {({height, width}) => (
            <PdfPreviewInner
              pdfDocument={documentState.pdfDocument}
              pages={documentState.pages}
              height={height}
              width={width}
              pdfControls={pdfControls.current}
              colorMode={colorMode}
            />
          )}
        </AutoSizer>
      </div>
    </div>
  );
}

export function PdfPreviewInner({
  pdfDocument,
  pages,
  width,
  height,
  pdfControls,
  colorMode,
}: {
  pdfDocument: PDFDocumentProxy;
  pages: PDFPageProxy[];
  width: number;
  height: number;
  pdfControls: PdfControls;
  colorMode: "grayscale" | "color";
}) {
  const computeDefaultScale = () => {
    const maxWidth = pages.reduce(
      (accumulator, page) =>
        Math.max(accumulator, page.getViewport({scale: 1.0}).width),
      0,
    );
    const maxHeight = pages.reduce(
      (accumulator, page) =>
        Math.max(accumulator, page.getViewport({scale: 1.0}).height),
      0,
    );
    return Math.min(width / maxWidth, height / maxHeight);
  };
  pdfControls.zoom = useConstCallback((delta: number | "reset") => {
    if (delta == "reset") {
      setScale(computeDefaultScale());
    } else {
      setScale((scale) => scale + delta);
    }
  });
  const [scale, setScale] = useState(computeDefaultScale);

  const getPageSize = useConstCallback((index: number) => {
    const viewport = pages[index].getViewport({scale});
    return viewport.height + PADDING_BETWEEN_PAGES;
  });
  const maxWidth = useMemo(
    () =>
      pages.reduce(
        (accumulator, page) =>
          Math.max(accumulator, page.getViewport({scale}).width),
        0,
      ),
    [pages, scale],
  );
  const listRef = useRef();
  useEffect(() => {
    listRef.current?.resetAfterIndex?.(0);
  }, [scale]);

  // Our """"esimated"""" item size. AKA, we compute all heights and divide by page count
  const estimatedItemSize = useMemo(
    () =>
      pages.reduce(
        (accumulator, page, index) => getPageSize(index) + accumulator,
        0,
      ) / pages.length,
    [scale, pages],
  );

  return (
    <VariableSizeList
      height={height}
      width={width}
      itemCount={pdfDocument.numPages}
      itemSize={getPageSize}
      itemData={{pdfDocument, pages, scale, maxWidth, colorMode}}
      estimatedItemSize={estimatedItemSize}
      ref={listRef}
    >
      {PdfPage}
    </VariableSizeList>
  );
}
