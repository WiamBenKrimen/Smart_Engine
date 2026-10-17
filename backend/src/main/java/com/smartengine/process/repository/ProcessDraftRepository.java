package com.smartengine.process.repository;
import com.smartengine.process.entity.ProcessDraft;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
public interface ProcessDraftRepository extends JpaRepository<ProcessDraft, Long> {
    Optional<ProcessDraft> findByIdAndOwnerEmail(Long id, String email);
    Optional<ProcessDraft> findFirstByOwnerEmailOrderByIdDesc(String email);
}
