package pi.integrated.mongotips.web;

import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;
import pi.integrated.mongotips.model.Tip;
import pi.integrated.mongotips.repository.TipRepository;

import java.time.Instant;
import java.util.List;

/**
 * API REST minimale : liste et ajout de « conseils » stockés dans MongoDB.
 */
@RestController
@RequestMapping("/api/tips")
@RequiredArgsConstructor
public class TipController {

    private final TipRepository tipRepository;

    @GetMapping
    public List<Tip> list() {
        return tipRepository.findAll();
    }

    @GetMapping("/{id}")
    public Tip one(@PathVariable String id) {
        return tipRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Tip introuvable"));
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public Tip create(@RequestBody Tip body) {
        if (body.getTitle() == null || body.getTitle().isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "title requis");
        }
        Tip tip = Tip.builder()
                .title(body.getTitle().trim())
                .content(body.getContent() != null ? body.getContent().trim() : "")
                .createdAt(Instant.now())
                .build();
        return tipRepository.save(tip);
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@PathVariable String id) {
        if (!tipRepository.existsById(id)) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND);
        }
        tipRepository.deleteById(id);
    }
}
