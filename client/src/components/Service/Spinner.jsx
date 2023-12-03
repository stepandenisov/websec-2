import Spinner from 'react-bootstrap/Spinner';

export function LoadSpinner() {
  return (
    <>
    <div class="container justify-content-end">
        <Spinner animation="grow" role="status">
            <span className="visually-hidden align-center">Loading...</span>
        </Spinner>
        <Spinner animation="grow" role="status">
            <span className="visually-hidden align-center">Loading...</span>
        </Spinner>
        <Spinner animation="grow" role="status">
            <span className="visually-hidden align-center">Loading...</span>
        </Spinner>
        <Spinner animation="grow" role="status">
            <span className="visually-hidden align-center">Loading...</span>
        </Spinner>
        <Spinner animation="grow" role="status">
            <span className="visually-hidden align-center">Loading...</span>
        </Spinner>
    </div>
    </>
  );
}