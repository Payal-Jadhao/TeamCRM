package com.teamcrm.security;

import com.teamcrm.entity.Permission;
import com.teamcrm.entity.User;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;

import java.util.Collection;
import java.util.HashSet;
import java.util.Set;

public class UserDetailsImpl implements UserDetails {
    private final Long id;
    private final String email;
    private final String password;
    private final String fullName;
    private final String teamTag;
    private final Boolean isActive;
    private final Boolean isFirstLogin;
    private final String roleName;
    private final Collection<? extends GrantedAuthority> authorities;

    public UserDetailsImpl(Long id, String email, String password, String fullName, String teamTag,
                           Boolean isActive, Boolean isFirstLogin, String roleName,
                           Collection<? extends GrantedAuthority> authorities) {
        this.id = id;
        this.email = email;
        this.password = password;
        this.fullName = fullName;
        this.teamTag = teamTag;
        this.isActive = isActive;
        this.isFirstLogin = isFirstLogin;
        this.roleName = roleName;
        this.authorities = authorities;
    }

    public static UserDetailsImpl build(User user) {
        Set<GrantedAuthority> authorities = new HashSet<>();
        // Add role authority
        if (user.getRole() != null) {
            authorities.add(new SimpleGrantedAuthority(user.getRole().getName()));
            if (user.getRole().getPermissions() != null) {
                for (Permission p : user.getRole().getPermissions()) {
                    authorities.add(new SimpleGrantedAuthority(p.getCode()));
                }
            }
        }
        // Add user-specific extra permissions
        if (user.getExtraPermissions() != null) {
            for (Permission p : user.getExtraPermissions()) {
                authorities.add(new SimpleGrantedAuthority(p.getCode()));
            }
        }

        return new UserDetailsImpl(
                user.getId(),
                user.getEmail(),
                user.getPasswordHash(),
                user.getFullName(),
                user.getTeamTag(),
                user.getIsActive(),
                user.getIsFirstLogin(),
                user.getRole() != null ? user.getRole().getName() : "ROLE_EMPLOYEE",
                authorities
        );
    }

    public Long getId() { return id; }
    public String getFullName() { return fullName; }
    public String getTeamTag() { return teamTag; }
    public Boolean getIsFirstLogin() { return isFirstLogin; }
    public String getRoleName() { return roleName; }

    @Override
    public Collection<? extends GrantedAuthority> getAuthorities() { return authorities; }

    @Override
    public String getPassword() { return password; }

    @Override
    public String getUsername() { return email; }

    @Override
    public boolean isAccountNonExpired() { return true; }

    @Override
    public boolean isAccountNonLocked() { return isActive; }

    @Override
    public boolean isCredentialsNonExpired() { return true; }

    @Override
    public boolean isEnabled() { return isActive; }
}
