"use client";

import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { fetchProfile } from "@/redux/slices/profileSlice";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Loader2, Mail, Briefcase, User, Shield, MapPin, KeyRound, Building } from "lucide-react";
import { toast } from "sonner";

export default function ProfilePage() {
  const dispatch = useDispatch();
  const { user: profile, loading: isLoading, error } = useSelector((state) => state.profile);

  useEffect(() => {
    dispatch(fetchProfile());
  }, [dispatch]);
  
  const [isSaving, setIsSaving] = useState(false);
  const [formData, setFormData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  if (isLoading) {
    return (
      <div className="flex h-full w-full items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8 text-center text-red-500">
        Failed to load profile. Please try again.
      </div>
    );
  }

  const user = profile?.data || profile || {};
  const initials = user?.name ? user.name.split(" ").map(n => n[0]).join("").substring(0,2).toUpperCase() : "AD";

  const handlePasswordChange = (e) => {
    e.preventDefault();
    if (formData.newPassword !== formData.confirmPassword) {
      toast.error("New passwords do not match!");
      return;
    }
    
    setIsSaving(true);
    // Simulate API call for password change
    setTimeout(() => {
      setIsSaving(false);
      setFormData({ currentPassword: "", newPassword: "", confirmPassword: "" });
      toast.success("Password updated successfully!");
    }, 1500);
  };

  return (
    <div className="space-y-6 animate-in fade-in-50 duration-500 pb-10">
      <PageHeader 
        title="My Profile" 
        description="Manage your account settings and preferences" 
      />

      <div className="grid gap-6 md:grid-cols-3">
        {/* Left Column: User Info Card */}
        <div className="space-y-6 md:col-span-1">
          <Card className="glass overflow-hidden border-0 shadow-lg relative">
            <div className="absolute top-0 w-full h-32 bg-gradient-to-br from-aspino-primary to-aspino-secondary opacity-90 z-0"></div>
            
            <CardContent className="pt-20 pb-6 flex flex-col items-center text-center relative z-10">
              <Avatar className="h-24 w-24 border-4 border-background shadow-xl mb-4">
                <AvatarImage src={user.avatarUrl} alt={user.name} />
                <AvatarFallback className="text-2xl font-bold bg-muted">{initials}</AvatarFallback>
              </Avatar>
              
              <h2 className="text-xl font-bold tracking-tight">{user.name || "Administrator"}</h2>
              <p className="text-sm text-muted-foreground flex items-center justify-center gap-1.5 mt-1">
                <Briefcase className="h-3.5 w-3.5" /> 
                {user.role || "HR Manager"}
              </p>
              
              <div className="mt-4 flex flex-wrap gap-2 justify-center">
                <Badge variant="secondary" className="px-3 py-1 font-medium bg-aspino-primary/10 text-aspino-primary border-0">
                  <Shield className="h-3 w-3 mr-1" />
                  {user.accessLevel || "Admin Level"}
                </Badge>
                <Badge variant="outline" className="px-3 py-1 font-medium">
                  Active
                </Badge>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-md border-0 bg-background/50">
            <CardHeader className="pb-3 border-b border-border/40">
              <CardTitle className="text-sm font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                <User className="h-4 w-4" /> 
                Contact Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 pt-4 text-sm">
              <div className="flex flex-col gap-1">
                <span className="text-muted-foreground font-medium text-xs">Email Address</span>
                <span className="flex items-center gap-2 font-medium">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  {user.email || "admin@aspino.com"}
                </span>
              </div>
              <div className="flex flex-col gap-1">
                <span className="text-muted-foreground font-medium text-xs">Department</span>
                <span className="flex items-center gap-2 font-medium">
                  <Building className="h-4 w-4 text-muted-foreground" />
                  {user.department || "Human Resources"}
                </span>
              </div>
              <div className="flex flex-col gap-1">
                <span className="text-muted-foreground font-medium text-xs">Location</span>
                <span className="flex items-center gap-2 font-medium">
                  <MapPin className="h-4 w-4 text-muted-foreground" />
                  {user.location || "Headquarters"}
                </span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column: Settings & Forms */}
        <div className="space-y-6 md:col-span-2">
          
          <Card className="shadow-md border-0">
            <CardHeader>
              <CardTitle>Change Password</CardTitle>
              <CardDescription>
                Update your password to keep your account secure.
              </CardDescription>
            </CardHeader>
            <form onSubmit={handlePasswordChange} noValidate>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="current">Current Password</Label>
                  <div className="relative">
                    <KeyRound className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input 
                      id="current" 
                      type="password" 
                      className="pl-9 bg-muted/30"
                      value={formData.currentPassword}
                      onChange={(e) => setFormData({...formData, currentPassword: e.target.value})}
                      required
                    />
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="new">New Password</Label>
                    <Input 
                      id="new" 
                      type="password" 
                      className="bg-muted/30"
                      value={formData.newPassword}
                      onChange={(e) => setFormData({...formData, newPassword: e.target.value})}
                      required
                      minLength={8}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="confirm">Confirm Password</Label>
                    <Input 
                      id="confirm" 
                      type="password" 
                      className="bg-muted/30"
                      value={formData.confirmPassword}
                      onChange={(e) => setFormData({...formData, confirmPassword: e.target.value})}
                      required
                    />
                  </div>
                </div>
              </CardContent>
              <CardFooter className="border-t bg-muted/10 px-6 py-4">
                <Button 
                  type="submit" 
                  disabled={isSaving || !formData.currentPassword || !formData.newPassword || !formData.confirmPassword}
                  className="bg-gradient-to-r from-aspino-primary to-aspino-secondary text-white hover:opacity-90 shadow-md transition-all ml-auto"
                >
                  {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Update Password
                </Button>
              </CardFooter>
            </form>
          </Card>
        </div>
      </div>
    </div>
  );
}
