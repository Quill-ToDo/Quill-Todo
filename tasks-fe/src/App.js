import Index from './components/Index';

function App() {
  return (
    <div>
          <div id="alert-wrapper">
            {/* {% if alert %} 
            {% include 'alert_box.html' with type="notice" body=alert %}
            {% endif %}
            {% if notice %} 
            {% include 'alert_box.html' with type="alert" body=alert %}
            {% endif %} */}
          </div>
          <Index />
    </div>
  );
}

export default App;
