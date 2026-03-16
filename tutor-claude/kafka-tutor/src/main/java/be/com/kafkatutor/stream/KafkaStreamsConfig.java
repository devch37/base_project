package be.com.kafkatutor.stream;

import be.com.kafkatutor.config.TopicProperties;
import be.com.kafkatutor.domain.OrderEvent;
import org.apache.kafka.common.serialization.Serdes;
import org.apache.kafka.streams.StreamsBuilder;
import org.apache.kafka.streams.kstream.Consumed;
import org.apache.kafka.streams.kstream.KStream;
import org.apache.kafka.streams.kstream.Produced;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.kafka.annotation.EnableKafkaStreams;
import org.springframework.kafka.support.serializer.JsonSerde;

@EnableKafkaStreams
@Configuration
public class KafkaStreamsConfig {

    @Bean
    public KStream<String, OrderEvent> orderEventsStream(
        StreamsBuilder streamsBuilder,
        TopicProperties properties
    ) {
        JsonSerde<OrderEvent> orderEventSerde = new JsonSerde<>(OrderEvent.class);

        KStream<String, OrderEvent> stream = streamsBuilder.stream(
            properties.orderEvents(),
            Consumed.with(Serdes.String(), orderEventSerde)
        );

        // Aggregate by event type to show a simple streaming use case.
        stream.groupBy((key, value) -> value.type())
            .count()
            .toStream()
            .to(properties.orderEventsCounts(), Produced.with(Serdes.String(), Serdes.Long()));

        return stream;
    }
}
