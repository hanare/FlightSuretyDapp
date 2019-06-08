
import DOM from './dom';
import Contract from './contract';
import './flightsurety.css';
  


(async() => {

    let result = null;
    toastr.options = {
        "closeButton": false,
        "debug": false,
        "newestOnTop": false,
        "progressBar": false,
        "positionClass": "toast-top-right",
        "preventDuplicates": false,
        "onclick": null,
        "showDuration": "300",
        "hideDuration": "1000",
        "timeOut": "5000",
        "extendedTimeOut": "1000",
        "showEasing": "swing",
        "hideEasing": "linear",
        "showMethod": "fadeIn",
        "hideMethod": "fadeOut"
      }
    let contract = new Contract('localhost', () => {
        
        // Read transaction
        contract.isOperational((error, result) => {
            console.log(error,result);
            display('Operational Status', 'Check if contract is operational', [ { label: 'Operational Status', error: error, value: result} ]);
        });
    

        // User-submitted transaction
        DOM.elid('submit-oracle').addEventListener('click', () => {
            let flight = DOM.elid('flight-number').value;
            // Write transaction
            contract.fetchFlightStatus(flight, (error, result) => {
                display('Oracles', 'Trigger oracles', [ { label: 'Fetch Flight Status', error: error, value: result.flight + ' ' + result.timestamp} ]);
            });
        });

        DOM.elid('get-flight-status').addEventListener('click' ,() => {
            let flight =  DOM.elid('flight-number-status').value;
            contract.fetchFlightStatus(flight, (error, result) => {
                display('Oracles', 'Trigger oracles', [ { label: 'Fetch Flight Status', error: error, value: result.flight + ' ' + result.timestamp} ]);
            });
        });

        // User-submitted transaction
        DOM.elid('buy-insurance').addEventListener('click', () => {
            //toastr["success"]('Page Loaded!');
            let airline = DOM.elid("airline-number").value;
            let flight  =  DOM.elid("flight-number-buy").value;
            let time =  DOM.elid("flight-time-buy").value;
            let amount  = DOM.elid("insurance-amount").value;
            // Write transaction
            console.log(airline,flight,time,amount);
            contract.buyInsurance(airline,flight,time,amount,(error, result) => {
                display('FLIGHT INSURANCE', 'STATUS ', [ { label: 'Fetch Flight Status', error: error, value: result.flight + ' ' + result.timestamp} ]);
               // toastr["error"]('I do not think that word means what you think it means.', 'Inconceivable!')

            });
        });

        DOM.elid('withdraw-funds').addEventListener('click', () => {
           
            // Write transaction
            contract.withdraw((error, result) => {
                display('Oracles', 'Trigger oracles', [ { label: 'Fetch Flight Status', error: error } ]);
            });
        });

        
    });
    
})();


function display(title, description, results) {
    let displayDiv = DOM.elid("display-wrapper");
    let section = DOM.section();
    section.appendChild(DOM.h2(title));
    section.appendChild(DOM.h5(description));
    results.map((result) => {
        let row = section.appendChild(DOM.div({className:'row'}));
        row.appendChild(DOM.div({className: 'col-sm-4 field'}, result.label));
        row.appendChild(DOM.div({className: 'col-sm-8 field-value'}, result.error ? String(result.error) : String(result.value)));
        section.appendChild(row);
    })
    displayDiv.append(section);

}







