package pi.integrated.mongotips.repository;

import org.springframework.data.mongodb.repository.MongoRepository;
import pi.integrated.mongotips.model.Tip;

public interface TipRepository extends MongoRepository<Tip, String> {
}
