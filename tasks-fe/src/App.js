import { Fragment } from 'react';
import Index from './components/Index';

function App() {
  return (
    <Fragment>
          <div id="alert-wrapper">
            {/* {% if alert %} 
            {% include 'alert_box.html' with type="notice" body=alert %}
            {% endif %}
            {% if notice %} 
            {% include 'alert_box.html' with type="alert" body=alert %}
            {% endif %} */}
          </div>
          <Index />
    </Fragment>
  );
}

export default App;
