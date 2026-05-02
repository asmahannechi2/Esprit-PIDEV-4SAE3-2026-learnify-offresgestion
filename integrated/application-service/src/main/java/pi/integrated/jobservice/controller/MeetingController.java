package pi.integrated.jobservice.controller;

import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import pi.integrated.jobservice.dto.MeetingDTO;
import pi.integrated.jobservice.dto.NextMeetingDTO;
import pi.integrated.jobservice.service.MeetingService;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/meetings")
@RequiredArgsConstructor
public class MeetingController {

    private final MeetingService meetingService;

    /** Liste complète (back-office admin). */
    @GetMapping
    public ResponseEntity<List<MeetingDTO>> getAllMeetings() {
        return ResponseEntity.ok(meetingService.getAllMeetings());
    }

    @PostMapping
    public ResponseEntity<?> scheduleMeeting(
            @RequestBody Map<String, Object> body,
            HttpServletRequest request) {
        try {
            if (body.get("applicationId") == null || body.get("meetingDate") == null) {
                return ResponseEntity.badRequest().body("Missing required fields: applicationId or meetingDate");
            }

            Long applicationId = Long.valueOf(body.get("applicationId").toString());
            
            // Allow override of evaluatorId from body (e.g. for Admin scheduling for others)
            Long evaluatorId;
            String evaluatorName;
            if (body.containsKey("evaluatorId") && body.get("evaluatorId") != null) {
                evaluatorId = Long.valueOf(body.get("evaluatorId").toString());
                evaluatorName = body.containsKey("evaluatorName") ? body.get("evaluatorName").toString() : "Assigned Evaluator";
            } else {
                evaluatorId = (Long) request.getAttribute("userId");
                evaluatorName = (String) request.getAttribute("userName");
            }
            
            String dateStr = body.get("meetingDate").toString();
            // Ensure ISO format compatibility (replace ' ' with 'T' if needed)
            dateStr = dateStr.replace(" ", "T");
            LocalDateTime meetingDate = LocalDateTime.parse(dateStr);
            
            Integer duration = 60;
            if (body.get("durationMinutes") != null) {
                duration = Integer.valueOf(body.get("durationMinutes").toString());
            }
            
            String notes = body.get("notes") != null ? body.get("notes").toString() : null;
            String meetingLink = body.get("meetingLink") != null ? body.get("meetingLink").toString() : "";

            MeetingDTO result = meetingService.scheduleMeeting(applicationId, evaluatorId, evaluatorName, meetingDate, duration, notes, meetingLink);
            return ResponseEntity.ok(result);
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body("Error scheduling meeting: " + e.getMessage());
        }
    }

    @PutMapping("/{id}")
    public ResponseEntity<MeetingDTO> updateMeeting(
            @PathVariable Long id,
            @RequestBody Map<String, Object> body) {
        LocalDateTime meetingDate = null;
        if (body.containsKey("meetingDate") && body.get("meetingDate") != null) {
            String dateStr = body.get("meetingDate").toString().replace(" ", "T");
            meetingDate = LocalDateTime.parse(dateStr);
        }
        
        Integer duration = body.containsKey("durationMinutes")
                ? Integer.valueOf(body.get("durationMinutes").toString()) : null;
        String notes = body.containsKey("notes") ? body.get("notes").toString() : null;
        String meetingLink = body.containsKey("meetingLink") ? body.get("meetingLink").toString() : null;
        Long evaluatorId = body.containsKey("evaluatorId") && body.get("evaluatorId") != null
                ? Long.valueOf(body.get("evaluatorId").toString()) : null;
        Integer scoreTech = body.containsKey("scoreTechnical") ? (Integer) body.get("scoreTechnical") : null;
        Integer scoreComm = body.containsKey("scoreCommunication") ? (Integer) body.get("scoreCommunication") : null;
        Integer scoreEng = body.containsKey("scoreEnglish") ? (Integer) body.get("scoreEnglish") : null;
        String recommend = (String) body.get("recommendation");

        return ResponseEntity.ok(meetingService.updateMeeting(id, meetingDate, duration, notes, meetingLink, evaluatorId,
                scoreTech, scoreComm, scoreEng, recommend));
    }

    @PutMapping("/{id}/evaluation")
    public ResponseEntity<MeetingDTO> saveEvaluation(
            @PathVariable Long id,
            @RequestBody Map<String, Object> body) {
        Integer tech = body.containsKey("scoreTechnical") ? (Integer) body.get("scoreTechnical") : null;
        Integer comm = body.containsKey("scoreCommunication") ? (Integer) body.get("scoreCommunication") : null;
        Integer eng = body.containsKey("scoreEnglish") ? (Integer) body.get("scoreEnglish") : null;
        String recommend = (String) body.get("recommendation");
        String notes = (String) body.get("notes");

        return ResponseEntity.ok(meetingService.saveEvaluation(id, tech, comm, eng, recommend, notes));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteMeeting(@PathVariable Long id) {
        meetingService.deleteMeeting(id);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/application/{applicationId}")
    public ResponseEntity<List<MeetingDTO>> getByApplication(@PathVariable Long applicationId) {
        return ResponseEntity.ok(meetingService.getMeetingsForApplication(applicationId));
    }

    @GetMapping("/room/{roomName}")
    public ResponseEntity<MeetingDTO> getByRoomName(@PathVariable String roomName) {
        return ResponseEntity.ok(meetingService.getMeetingByRoomName(roomName));
    }

    @GetMapping("/my")
    public ResponseEntity<List<MeetingDTO>> myMeetings(HttpServletRequest request) {
        Long userId = (Long) request.getAttribute("userId");
        String role = (String) request.getAttribute("userRole");
        if ("TUTOR".equals(role)) {
            return ResponseEntity.ok(meetingService.getMeetingsForTeacher(userId));
        } else {
            return ResponseEntity.ok(meetingService.getMeetingsForEvaluator(userId));
        }
    }

    @GetMapping("/next")
    public ResponseEntity<NextMeetingDTO> nextMeeting(HttpServletRequest request) {
        Long userId = (Long) request.getAttribute("userId");
        return meetingService.getNextMeetingForUser(userId)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.noContent().build());
    }
}
