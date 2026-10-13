package dev.ironlog;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.jayway.jsonpath.JsonPath;
import java.util.List;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;
import org.springframework.transaction.annotation.Transactional;

@SpringBootTest
@AutoConfigureMockMvc
@Transactional
class IronlogApiTest {

    @Autowired
    private MockMvc mockMvc;

    @Test
    void fullTrainingLifecycle() throws Exception {
        String token = register();

        mockMvc.perform(get("/api/auth/me"))
                .andExpect(status().isUnauthorized());

        mockMvc.perform(get("/api/auth/me").header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.email").value("lifter@ironlog.dev"));

        String benchPressId = firstExerciseId(token, "Barbell Bench Press");

        String workoutBody = """
                {
                  "title": "Push Day",
                  "startedAt": "2026-01-05T17:00:00Z",
                  "completedAt": "2026-01-05T18:00:00Z",
                  "status": "COMPLETED",
                  "notes": "felt strong",
                  "exercises": [
                    {
                      "exerciseId": "%s",
                      "sets": [
                        {"reps": 5, "weightKg": 100, "rpe": 8},
                        {"reps": 5, "weightKg": 100, "rpe": 9}
                      ]
                    }
                  ]
                }
                """.formatted(benchPressId);

        MvcResult created = mockMvc.perform(post("/api/workouts")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(workoutBody))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.setCount").value(2))
                .andExpect(jsonPath("$.totalVolumeKg").value(1000.00))
                .andExpect(jsonPath("$.exercises[0].exerciseName").value("Barbell Bench Press"))
                .andReturn();

        String workoutId = JsonPath.read(created.getResponse().getContentAsString(), "$.id");

        mockMvc.perform(get("/api/workouts/" + workoutId).header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.title").value("Push Day"));

        mockMvc.perform(get("/api/workouts").header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.totalItems").value(1))
                .andExpect(jsonPath("$.items[0].totalVolumeKg").value(1000.00));

        mockMvc.perform(get("/api/stats/summary").header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.totalWorkouts").value(1))
                .andExpect(jsonPath("$.totalSets").value(2))
                .andExpect(jsonPath("$.totalReps").value(10));

        mockMvc.perform(get("/api/stats/records").header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].exerciseName").value("Barbell Bench Press"))
                .andExpect(jsonPath("$[0].bestWeightKg").value(100.00));

        mockMvc.perform(get("/api/stats/volume").param("weeks", "8").header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(8));
    }

    @Test
    void rejectsDuplicateEmailAndBadPayload() throws Exception {
        register();

        mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"email":"second@ironlog.dev","password":"password123","displayName":"Second"}
                                """))
                .andExpect(status().isCreated());

        mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"email":"second@ironlog.dev","password":"password123","displayName":"Clone"}
                                """))
                .andExpect(status().isConflict());

        mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"email":"not-an-email","password":"short","displayName":""}
                                """))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.fieldErrors").exists());
    }

    @Test
    void loginWithWrongPasswordIsUnauthorized() throws Exception {
        register();
        mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"email":"lifter@ironlog.dev","password":"wrong-password"}
                                """))
                .andExpect(status().isUnauthorized());
    }

    private String register() throws Exception {
        MvcResult result = mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"email":"lifter@ironlog.dev","password":"password123","displayName":"Lifter","unit":"KG"}
                                """))
                .andExpect(status().isCreated())
                .andReturn();
        return JsonPath.read(result.getResponse().getContentAsString(), "$.token");
    }

    private String firstExerciseId(String token, String name) throws Exception {
        MvcResult result = mockMvc.perform(get("/api/exercises")
                        .param("q", name)
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andReturn();
        List<String> ids = JsonPath.read(result.getResponse().getContentAsString(), "$[*].id");
        assertThat(ids).isNotEmpty();
        return ids.get(0);
    }
}
