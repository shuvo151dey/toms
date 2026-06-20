package tech.smdey.toms.repository;

import org.springframework.data.jpa.repository.JpaRepository;

import tech.smdey.toms.entity.ProcessedKafkaMessage;

public interface ProcessedKafkaMessageRepository extends JpaRepository<ProcessedKafkaMessage, Long> {
    Boolean existsByTopicAndPartitionAndOffset(String topic, Integer partition, Long offset);
}
