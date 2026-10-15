package tutor.chat.cobrowse.relay;

/** 서버 1대용: 바로 로컬 브로커로. */
public class LocalMessageRelay implements MessageRelay {

    private final LocalBroker broker;
    private final ControlHandler control;

    public LocalMessageRelay(LocalBroker broker, ControlHandler control) {
        this.broker = broker;
        this.control = control;
    }

    @Override
    public void publish(String destination, byte[] json) {
        broker.send(destination, json);
    }

    @Override
    public void publishControl(ControlEvent event) {
        control.handle(event);
    }
}
