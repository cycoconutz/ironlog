package dev.ironlog.security;

import dev.ironlog.domain.User;
import dev.ironlog.repo.UserRepository;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;

@Service
public class AppUserDetailsService implements UserDetailsService {

    private final UserRepository users;

    public AppUserDetailsService(UserRepository users) {
        this.users = users;
    }

    @Override
    public UserDetails loadUserByUsername(String username) throws UsernameNotFoundException {
        User user = users.findByEmailIgnoreCase(username)
                .orElseThrow(() -> new UsernameNotFoundException("No user with email " + username));
        return new UserPrincipal(user.getId(), user.getEmail(), user.getDisplayName());
    }
}
