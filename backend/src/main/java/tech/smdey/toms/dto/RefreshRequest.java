package tech.smdey.toms.dto;

public class RefreshRequest {
    private String refreshToken;

    public void setRefreshToken(String token){
        this.refreshToken = token;
    }

    public String getRefreshToken(){
        return refreshToken;
    }
}
